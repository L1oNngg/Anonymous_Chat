# ./manager.py
from fastapi import WebSocket
from typing import Dict
import logging
import uuid
from redis_client import add_user_to_ip, remove_user_from_ip, get_users_for_ip, set_session, get_redis

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Dict[str, WebSocket]]] = {}  # roomId -> {sessionId -> {username: WebSocket}}
        self.ip_to_users: Dict[str, list] = {}
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
            logger.info(f"Reused existing session for {username}: {session_id}")
        else:
            self.sessions[username][session_id] = username
            await set_session(username, session_id)
            logger.info(f"Created new session for {username}: {session_id}")
        return session_id

    async def set_room_options(self, room_id: str, room_type: str, options: dict = None):
        """Đặt options cho phòng, bao gồm max_connections_per_ip cho phòng riêng."""
        if options is None:
            options = {}
        self.room_options[room_id] = {
            "type": room_type,
            "max_connections_per_ip": options.get("max_connections_per_ip", 2) if room_type == "private" else None
        }
        logger.info(f"Set room options for {room_id}: {self.room_options[room_id]}")

    async def connect(self, websocket: WebSocket, username: str, client_ip: str, room_id: str):
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}

        session_id = websocket.query_params.get("sessionId", "")
        if not session_id or (username not in self.sessions) or (session_id not in self.sessions[username]):
            await websocket.close(code=1008, reason="Invalid session ID.")
            logger.warning(f"Connection rejected for {username}: Invalid session ID.")
            return False

        if room_id not in self.room_options:
            await self.set_room_options(room_id, "public")  # Mặc định là public nếu chưa có options

        room_type = self.room_options[room_id]["type"]
        max_connections = self.room_options[room_id].get("max_connections_per_ip")

        if client_ip not in self.ip_to_users:
            self.ip_to_users[client_ip] = await get_users_for_ip(client_ip)

        current_users = self.ip_to_users[client_ip]
        if room_type == "private" and max_connections is not None and len(current_users) >= max_connections:
            await websocket.close(code=1008, reason=f"Maximum connections ({max_connections}) reached for this IP.")
            logger.warning(f"Connection rejected for IP {client_ip}: Max limit reached for private room.")
            return False
        # Phòng public không giới hạn
        elif room_type == "public" and max_connections is None:
            pass
        else:
            await websocket.close(code=1008, reason="Invalid room configuration.")
            logger.warning(f"Connection rejected for {room_id}: Invalid room configuration.")
            return False

        await websocket.accept()
        if session_id not in self.active_connections[room_id]:
            self.active_connections[room_id][session_id] = {}
        self.active_connections[room_id][session_id][username] = websocket
        self.ip_to_users[client_ip].append(username)
        logger.info(f"Connected: {username} from IP {client_ip} with session {session_id}")
        await self.broadcast({"type": "notification", "content": f"{username} has joined the chat", "roomId": room_id}, room_id)
        await self.broadcast_users(room_id)
        return True

    async def disconnect(self, websocket: WebSocket, username: str, client_ip: str, room_id: str):
        session_id = websocket.query_params.get("sessionId", "")
        if room_id in self.active_connections and session_id in self.active_connections[room_id] and username in self.active_connections[room_id][session_id]:
            del self.active_connections[room_id][session_id][username]
            if not self.active_connections[room_id][session_id]:
                del self.active_connections[room_id][session_id]
            if client_ip in self.ip_to_users and username in self.ip_to_users[client_ip]:
                self.ip_to_users[client_ip].remove(username)
                if not self.ip_to_users[client_ip]:
                    del self.ip_to_users[client_ip]
            await remove_user_from_ip(client_ip, username)
            if username in self.sessions and session_id in self.sessions[username]:
                del self.sessions[username][session_id]
                if not self.sessions[username]:
                    del self.sessions[username]
            logger.info(f"Disconnected: {username} from IP {client_ip}")
            await self.broadcast({"type": "notification", "content": f"{username} has left the chat", "roomId": room_id}, room_id)
            await self.broadcast_users(room_id)

    async def broadcast(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            sender_username = message.get("username")
            room_id = message.get("roomId", room_id)  # Đảm bảo roomId từ message được ưu tiên
            for session_id in list(self.active_connections[room_id].keys()):  # Sử dụng list để tránh lỗi khi sửa đổi dict
                for user, ws in list(self.active_connections[room_id][session_id].items()):  # Sử dụng list để tránh lỗi
                    # Không gửi lại publicKey cho người gửi
                    if message.get("type") == "publicKey" and user == sender_username:
                        continue
                    try:
                        await ws.send_json(message)
                        logger.debug(f"Sent to {user} in room {room_id}: {message}")
                    except Exception as e:
                        logger.error(f"Broadcast failed for {user}: {e}")
                        await self.disconnect(ws, user, client_ip="unknown_ip", room_id=room_id)

    async def broadcast_users(self, room_id: str):
        if room_id in self.active_connections:
            users = set()  # Sử dụng set để loại bỏ trùng lặp
            for session_id in self.active_connections[room_id]:
                users.update(self.active_connections[room_id][session_id].keys())
            await self.broadcast({"type": "users", "users": list(users), "roomId": room_id}, room_id)

    def store_public_key(self, username: str, public_key: str):
        """Lưu trữ publicKey của người dùng."""
        self.public_keys[username] = public_key
        logger.info(f"Stored public key for {username}")

manager = ConnectionManager()