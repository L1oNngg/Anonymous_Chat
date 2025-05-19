# /app/manager.py
from fastapi import WebSocket
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket
        logger.info(f"Connected: {username}")
        await self.broadcast({"type": "notification", "content": f"{username} has joined the chat"})
        await self.broadcast_users()

    async def disconnect(self, username: str): 
        if username in self.active_connections:
            del self.active_connections[username]
            logger.info(f"Disconnected: {username}")
            await self.broadcast({"type": "notification", "content": f"{username} has left the chat"})
            await self.broadcast_users()

    async def broadcast(self, message: dict):
        for user, ws in list(self.active_connections.items()):
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast failed for {user}: {e}")
                await self.disconnect(user)

    async def broadcast_users(self):
        users = list(self.active_connections.keys())
        await self.broadcast({"type": "users", "users": users})

manager = ConnectionManager()