# ./manager.py
from fastapi import WebSocket
from typing import Dict
import logging
import uuid
import json
from redis_client import add_user_to_ip, remove_user_from_ip, get_users_for_ip, set_session, get_redis

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Dict[str, WebSocket]]] = {}  # roomId -> {sessionId -> {username: WebSocket}}
        self.ip_to_users: Dict[str, Dict[str, list]] = {}  # roomId -> {ip: [username]}
        self.sessions: Dict[str, Dict[str, str]] = {}  # username -> {sessionId: username}
        self.room_options: Dict[str, dict] = {}  # roomId -> {type: str, max_connections_per_ip: int}
        self.public_keys: Dict[str, str] = {}  # username -> publicKey

    async def create_session(self, username: str):
        redis = get_redis()
        session_id = str(uuid.uuid4())
        if username not in self.sessions:
            self.sessions[username] = {}
        # Kiểm tra Redis trước
        existing_session = await redis.get(f"session:{username}")
        if existing_session:
            session_id = existing_session.decode()
            self.sessions[username][session_id] = username
            # logger.info(f"Reused existing session for {username}: {session_id}")
        else:
            self.sessions[username][session_id] = username
            await set_session(username, session_id)
            # logger.info(f"Created new session for {username}: {session_id}")
        return session_id

    async def set_room_options(self, room_id: str, room_type: str, options: dict = None):
        if options is None:
            options = {}
        room_id = str(room_id)  # Đảm bảo luôn là string
        self.room_options[room_id] = {
            "type": room_type,
            "max_connections_per_ip": options.get("max_connections_per_ip", 2) if room_type == "private" else None
        }
        redis = get_redis()
        await redis.set(f"room_options:{room_id}", json.dumps(self.room_options[room_id]))
        # logger.info(f"Set room options for {room_id}: {self.room_options[room_id]}")

    async def load_room_options(self, room_id: str):
        room_id = str(room_id)  # Đảm bảo luôn là string
        redis = get_redis()
        data = await redis.get(f"room_options:{room_id}")
        if data:
            self.room_options[room_id] = json.loads(data)
            # logger.info(f"Loaded room_options for {room_id} from Redis: {self.room_options[room_id]}")
        else:
            # logger.warning(f"room_options for {room_id} not found in Redis")
            pass

    async def connect(self, websocket: WebSocket, username: str, client_ip: str, room_id: str):
        room_id = str(room_id)
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        if room_id not in self.ip_to_users:
            self.ip_to_users[room_id] = {}

        session_id = websocket.query_params.get("sessionId", "")
        if not session_id or (username not in self.sessions) or (session_id not in self.sessions[username]):
            await websocket.close(code=1008, reason="Invalid session ID.")
            return False

        # Đảm bảo room_options luôn tồn tại
        if room_id not in self.room_options:
            await self.load_room_options(room_id)
            if room_id not in self.room_options:
                # Thiết lập mặc định cho phòng riêng nếu chưa có
                await self.set_room_options(room_id, "private", {"max_connections_per_ip": 2})

        # Nếu vẫn không có cấu hình phòng, từ chối kết nối
        if room_id not in self.room_options:
            await websocket.close(code=1008, reason="Invalid room configuration.")
            return False

        room_type = self.room_options[room_id]["type"]
        max_connections = self.room_options[room_id].get("max_connections_per_ip", 2)

        # Chỉ kiểm tra số lượng kết nối IP nếu là phòng riêng
        if room_type == "private":
            current_users = self.ip_to_users.get(room_id, {}).get(client_ip, [])
            if len(current_users) >= max_connections:
                await websocket.close(code=1008, reason="Maximum connections reached for this IP.")
                return False

        await websocket.accept()
        # Cập nhật ip_to_users sau khi chấp nhận kết nối (chỉ cho phòng riêng)
        if room_type == "private":
            self.ip_to_users.setdefault(room_id, {}).setdefault(client_ip, []).append(username)
        if session_id not in self.active_connections[room_id]:
            self.active_connections[room_id][session_id] = {}
        self.active_connections[room_id][session_id][username] = websocket
        await self.broadcast({"type": "notification", "content": f"{username} has joined the chat", "roomId": room_id}, room_id)
        await self.broadcast_users(room_id)
        return True

    async def disconnect(self, websocket: WebSocket, username: str, client_ip: str, room_id: str):
        session_id = websocket.query_params.get("sessionId", "")
        room_id = str(room_id)
        if room_id in self.active_connections and session_id in self.active_connections[room_id] and username in self.active_connections[room_id][session_id]:
            del self.active_connections[room_id][session_id][username]
            if not self.active_connections[room_id][session_id]:
                del self.active_connections[room_id][session_id]
            # Chỉ xóa user khỏi ip_to_users nếu là phòng riêng
            room_type = self.room_options.get(room_id, {}).get("type", "private")
            if room_type == "private":
                if room_id in self.ip_to_users and client_ip in self.ip_to_users[room_id] and username in self.ip_to_users[room_id][client_ip]:
                    self.ip_to_users[room_id][client_ip].remove(username)
                    if not self.ip_to_users[room_id][client_ip]:
                        del self.ip_to_users[room_id][client_ip]
                await remove_user_from_ip(client_ip, username)
            if username in self.sessions and session_id in self.sessions[username]:
                del self.sessions[username][session_id]
                if not self.sessions[username]:
                    del self.sessions[username]
            await self.broadcast({"type": "notification", "content": f"{username} has left the chat", "roomId": room_id}, room_id)
            await self.broadcast_users(room_id)

    async def broadcast(self, message: dict, room_id: str):
        # Hỗ trợ gửi tin nhắn riêng
        if message.get("type") == "private_message":
            target_username = message.get("to")
            if not target_username:
                return
            for session_id, users in self.active_connections.get(room_id, {}).items():
                if target_username in users:
                    await users[target_username].send_json(message)
                    break
            return
        if room_id in self.active_connections:
            sender_username = message.get("username")
            room_id = message.get("RoomId", room_id)  # Đảm bảo roomId từ message được ưu tiên
            to_remove = []
            for session_id in list(self.active_connections[room_id].keys()):
                for user, ws in list(self.active_connections[room_id][session_id].items()):
                    # Không gửi lại publicKey cho người gửi
                    if message.get("type") == "publicKey" and user == sender_username:
                        continue
                    try:
                        await ws.send_json(message)
                        # logger.debug(f"Sent to {user} in room {room_id}: {message}")
                    except Exception as e:
                        # logger.error(f"Broadcast failed for {user}: {e}")
                        # Xóa reference WebSocket đã đóng
                        to_remove.append((session_id, user, ws))
            # Xóa các WebSocket đã đóng khỏi active_connections
            for session_id, user, ws in to_remove:
                if session_id in self.active_connections[room_id] and user in self.active_connections[room_id][session_id]:
                    del self.active_connections[room_id][session_id][user]
                    # logger.info(f"Removed closed WebSocket for {user} in room {room_id}")
                # Nếu session_id không còn user nào, xóa luôn session_id
                if session_id in self.active_connections[room_id] and not self.active_connections[room_id][session_id]:
                    del self.active_connections[room_id][session_id]

    async def broadcast_users(self, room_id: str):
        if room_id in self.active_connections:
            users = set()  # Sử dụng set để loại bỏ trùng lặp
            for session_id in self.active_connections[room_id]:
                users.update(self.active_connections[room_id][session_id].keys())
            await self.broadcast({"type": "users", "users": list(users), "roomId": room_id}, room_id)

    def store_public_key(self, username: str, public_key: str):
        self.public_keys[username] = public_key
        # logger.info(f"Stored public key for {username}")

manager = ConnectionManager()