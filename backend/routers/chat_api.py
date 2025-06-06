# ./routers/chat_api.py
from fastapi import APIRouter, HTTPException
from redis_client import get_redis
from config import REDIS_CHANNEL
import json
from datetime import datetime
from manager import manager
from models.schemas import SendMessageRequest
import re
from utils.jwt_utils import create_jwt, decode_jwt
from pydantic import BaseModel

api_router = APIRouter()

class SetRoomOptionsRequest(BaseModel):
    room_id: int
    room_type: str
    options: dict = {}

class RoomInfo(BaseModel):
    id: int
    name: str
    type: str
    code: str = None
    createdAt: int = None
    max_connections_per_ip: int = 2

@api_router.post("/send/")
async def send_message(req: SendMessageRequest):
    redis_client = get_redis()
    try:
        content_dict = req.content.dict(exclude_unset=True)  # Chuyển content thành dict
        # Input validation: loại bỏ script tag trong text
        if req.type == "message" and "text" in content_dict:
            if re.search(r'<\s*script', content_dict["text"], re.IGNORECASE):
                raise HTTPException(status_code=400, detail="Tin nhắn chứa mã độc không hợp lệ.")
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
    # Không dùng sessionId truyền thống nữa, trả về JWT
    token = create_jwt(username)
    return {"sessionId": token}

@api_router.post("/create_room")
async def create_room(room: RoomInfo):
    redis = get_redis()
    # Lưu phòng vào Redis (dùng hash hoặc list)
    await redis.hset("rooms", str(room.id), room.json())  # Đảm bảo key là str
    return {"status": "success", "room": room.dict()}

@api_router.post("/set_room_options")
async def set_room_options(req: SetRoomOptionsRequest):
    await manager.set_room_options(str(req.room_id), req.room_type, req.options or {})
    # Cập nhật max_connections_per_ip cho phòng trong Redis nếu có
    redis = get_redis()
    room_raw = await redis.hget("rooms", str(req.room_id))  # Đảm bảo key là str
    if room_raw:
        room = json.loads(room_raw)
        if req.options and "max_connections_per_ip" in req.options:
            room["max_connections_per_ip"] = req.options["max_connections_per_ip"]
        await redis.hset("rooms", str(req.room_id), json.dumps(room))
    return {"status": "success", "room_id": req.room_id, "room_type": req.room_type, "options": req.options}

@api_router.get("/rooms")
async def get_rooms():
    redis = get_redis()
    rooms = await redis.hgetall("rooms")
    # Trả về danh sách phòng (giá trị là bytes hoặc str, cần xử lý an toàn)
    result = []
    for v in rooms.values():
        if isinstance(v, bytes):
            result.append(json.loads(v.decode()))
        else:
            result.append(json.loads(v))
    return result