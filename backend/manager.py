# ./manager.py
from fastapi import WebSocket
from typing import Dict
import logging
from redis_client import increment_ip_connection, decrement_ip_connection

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, username: str, client_ip: str):
        # Kiểm tra giới hạn kết nối theo IP
        if not await increment_ip_connection(client_ip):
            await websocket.close(code=1008, reason="Maximum connections (2) reached for this IP.")
            logger.warning(f"Connection rejected for IP {client_ip}: Max limit reached.")
            return False
        await websocket.accept()
        self.active_connections[username] = websocket
        logger.info(f"Connected: {username} from IP {client_ip}")
        await self.broadcast({"type": "notification", "content": f"{username} has joined the chat"})
        await self.broadcast_users()
        return True

    async def disconnect(self, username: str, client_ip: str):
        if username in self.active_connections:
            del self.active_connections[username]
            logger.info(f"Disconnected: {username} from IP {client_ip}")
            await self.broadcast({"type": "notification", "content": f"{username} has left the chat"})
            await self.broadcast_users()
            await decrement_ip_connection(client_ip)

    async def broadcast(self, message: dict):
        for user, ws in list(self.active_connections.items()):
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast failed for {user}: {e}")
                await self.disconnect(user, "unknown_ip")  # IP mặc định nếu không xác định

    async def broadcast_users(self):
        users = list(self.active_connections.keys())
        await self.broadcast({"type": "users", "users": users})

manager = ConnectionManager()