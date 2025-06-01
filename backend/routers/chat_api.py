# ./routers/chat_api.py
from fastapi import APIRouter, HTTPException
from redis_client import get_redis
from config import REDIS_CHANNEL
import json
from datetime import datetime
from manager import manager
from models.schemas import SendMessageRequest

api_router = APIRouter()

@api_router.post("/send/")
async def send_message(req: SendMessageRequest):
    redis_client = get_redis()
    try:
        content_dict = req.content.dict(exclude_unset=True)  # Chuyển content thành dict
        if req.type == "sticker" and "sticker_id" not in content_dict:
            content_dict["sticker_id"] = req.content.text or req.content.emoji or "unknown"  # Dùng text/emoji làm fallback
        msg = {
            "type": req.type,
            "username": req.username,
            "content": content_dict,
            "timestamp": datetime.utcnow().isoformat()
        }
        room_channel = f"{REDIS_CHANNEL}:{req.roomId}"
        await redis_client.rpush(room_channel, json.dumps(msg))
        await manager.broadcast(msg, str(req.roomId))
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

@api_router.get("/session/{username}")
async def get_session_id(username: str):
    if username not in manager.sessions:
        session_id = await manager.create_session(username)
    else:
        session_id = list(manager.sessions[username].keys())[0] if manager.sessions[username] else await manager.create_session(username)
    return {"sessionId": session_id}

@api_router.post("/set_room_options")
async def set_room_options(room_id: int, room_type: str, options: dict = None):
    if options is None:
        options = {}
    await manager.set_room_options(str(room_id), room_type, options)
    return {"status": "success", "room_id": room_id, "room_type": room_type, "options": options}