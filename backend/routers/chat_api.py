from fastapi import APIRouter, HTTPException
from redis_client import get_redis
from config import REDIS_CHANNEL
import json

api_router = APIRouter()

@api_router.post("/send/")
async def send_message(username: str, content: str):
    redis_client = get_redis()
    try:
        await redis_client.rpush(REDIS_CHANNEL, json.dumps({
            "username": username,
            "content": content
        }))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/")
async def get_messages():
    redis_client = get_redis()
    try:
        messages_raw = await redis_client.lrange(REDIS_CHANNEL, 0, -1)
        return [json.loads(m) for m in messages_raw]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
