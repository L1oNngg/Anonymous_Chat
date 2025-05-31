# ./manager.py
from fastapi import WebSocket
from typing import Dict
import logging
from redis_client import add_user_to_ip, remove_user_from_ip, get_users_for_ip

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # username -> WebSocket
        self.ip_to_users: Dict[str, list] = {}  # IP -> list of usernames

    async def connect(self, websocket: WebSocket, username: str, client_ip: str):
        # Kiểm tra username trùng
        if username in self.active_connections:
            await websocket.close(code=1008, reason="Username already in use.")
            logger.warning(f"Connection rejected for {username}: Username already in use.")
            return False

        # Kiểm tra danh sách người dùng cho IP
        if client_ip not in self.ip_to_users:
            self.ip_to_users[client_ip] = await get_users_for_ip(client_ip)

        current_users = self.ip_to_users[client_ip]
        if len(current_users) >= 2:  # Giới hạn 2 kết nối/IP
            await websocket.close(code=1008, reason="Maximum connections (2) reached for this IP. Please wait for another user to disconnect.")
            logger.warning(f"Connection rejected for IP {client_ip}: Max limit reached. Current users: {current_users}")
            return False

        # Thêm người dùng vào Redis và danh sách nội bộ
        if not await add_user_to_ip(client_ip, username):
            await websocket.close(code=1008, reason="Failed to add user to IP list.")
            logger.error(f"Failed to add {username} to IP {client_ip}")
            return False

        await websocket.accept()
        self.active_connections[username] = websocket
        self.ip_to_users[client_ip].append(username)
        logger.info(f"Connected: {username} from IP {client_ip}")
        await self.broadcast({"type": "notification", "content": f"{username} has joined the chat"})
        await self.broadcast_users()
        return True

    async def disconnect(self, username: str, client_ip: str):
        if username in self.active_connections:
            del self.active_connections[username]
            if client_ip in self.ip_to_users and username in self.ip_to_users[client_ip]:
                self.ip_to_users[client_ip].remove(username)
                if not self.ip_to_users[client_ip]:
                    del self.ip_to_users[client_ip]  # Xóa IP nếu không còn người dùng
            await remove_user_from_ip(client_ip, username)
            logger.info(f"Disconnected: {username} from IP {client_ip}")
            await self.broadcast({"type": "notification", "content": f"{username} has left the chat"})
            await self.broadcast_users()

    async def broadcast(self, message: dict):
        for user, ws in list(self.active_connections.items()):
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast failed for {user}: {e}")
                await self.disconnect(user, "unknown_ip")

    async def broadcast_users(self):
        users = list(self.active_connections.keys())
        await self.broadcast({"type": "users", "users": users})

manager = ConnectionManager()