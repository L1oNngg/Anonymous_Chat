from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from redis_client import get_redis
from config import REDIS_CHANNEL
from manager import manager
from datetime import datetime

websocket_router = APIRouter()

@websocket_router.websocket("/ws/chat/{username}")
async def chat_ws(websocket: WebSocket, username: str):
    await manager.connect(websocket, username)
    redis_client = get_redis()

    try:
        # Send history
        messages_raw = await redis_client.lrange(REDIS_CHANNEL, 0, -1)
        messages = [json.loads(m) for m in messages_raw]
        await websocket.send_json({"type": "history", "messages": messages})

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received WebSocket data: {message}")

            if message.get("type") in ["message", "sticker"]:
                msg = {
                    "type": message["type"],
                    "username": username,
                    "content": message["content"],
                    "timestamp": message.get("timestamp", datetime.utcnow().isoformat())
                }
                await redis_client.rpush(REDIS_CHANNEL, json.dumps(msg))
                await manager.broadcast(msg)
            else:
                print(f"Ignored message with type: {message.get('type')}")

    except WebSocketDisconnect:
        manager.disconnect(username)
    except Exception as e:
        manager.disconnect(username)
        print(f"WebSocket error: {e}")