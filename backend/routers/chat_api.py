from fastapi import APIRouter, HTTPException
from redis_client import get_redis
from config import REDIS_CHANNEL
import json
from datetime import datetime

api_router = APIRouter()

@api_router.post("/send/")
async def send_message(username: str, content: str, roomId: str, type: str = "message"):
    redis_client = get_redis()
    try:
        msg = {
            "type": type,
            "username": username,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        # Lưu tin nhắn vào Redis theo roomId
        room_channel = f"{REDIS_CHANNEL}:{roomId}"
        await redis_client.rpush(room_channel, json.dumps(msg))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/{room_id}/")
async def get_messages(room_id: str):
    redis_client = get_redis()
    try:
        room_channel = f"{REDIS_CHANNEL}:{room_id}"
        messages_raw = await redis_client.lrange(room_channel, 0, -1)
        return [json.loads(m) for m in messages_raw]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))