from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis
import redis.exceptions
import redis.asyncio as aioredis
import json
import asyncio
import logging
from typing import Dict
from dotenv import load_dotenv
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_CHANNEL = "chat"

# Redis connection
async def get_redis_client():
    try:
        client = aioredis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True
        )
        await client.ping()
        return client
    except redis.exceptions.ConnectionError as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise

async def startup_event():
    global redis_client
    redis_client = await get_redis_client()

app.add_event_handler("startup", startup_event)

# Pydantic model for message validation
class Message(BaseModel):
    username: str
    content: str

# Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket
        logger.info(f"Client connected: {username}")

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
            logger.info(f"Client disconnected: {username}")

    async def broadcast(self, message: dict):
        for username, connection in list(self.active_connections.items()):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {username}: {e}")
                self.disconnect(username)

manager = ConnectionManager()

# WebSocket Endpoint
@app.websocket("/ws/chat/{username}")
async def chat_websocket_endpoint(websocket: WebSocket, username: str):
    try:
        await manager.connect(websocket, username)

        # Send initial history
        try:
            messages = await get_messages_history()
            await websocket.send_json({"type": "history", "messages": messages})
        except Exception as e:
            logger.error(f"Error getting message history for {username}: {e}")

        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                if not isinstance(message, dict) or "type" not in message:
                    logger.warning(f"Invalid message format from {username}: {message}")
                    continue

                if message["type"] == "message":
                    await send_message_to_redis(message["content"], username)
                    await manager.broadcast({
                        "type": "message",
                        "username": username,
                        "content": message["content"]
                    })
        except WebSocketDisconnect:
            manager.disconnect(username)
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON from {username}")
        except Exception as e:
            logger.error(f"Error receiving from {username}: {e}", exc_info=True)
    finally:
        manager.disconnect(username)

# REST API Endpoints
@app.post("/send/")
async def send_message_to_redis(content: str, username: str):
    try:
        await redis_client.rpush(REDIS_CHANNEL, json.dumps({
            "username": username,
            "content": content
        }))
        return {"status": "success", "message": "Message stored"}
    except Exception as e:
        logger.error(f"Error sending message to Redis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages/")
async def get_messages_history():
    try:
        messages_raw = await redis_client.lrange(REDIS_CHANNEL, 0, -1)
        messages = [json.loads(m) for m in messages_raw]
        return messages
    except Exception as e:
        logger.error(f"Error getting message history from Redis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)