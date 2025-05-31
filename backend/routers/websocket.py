# ./routers/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from redis_client import get_redis
from config import REDIS_CHANNEL
from manager import manager
from datetime import datetime

websocket_router = APIRouter()

@websocket_router.websocket("/ws/chat/{username}")
async def chat_ws(websocket: WebSocket, username: str):
    client_ip = websocket.client.host if websocket.client else "unknown"
    # Kiểm tra kết nối
    if not await manager.connect(websocket, username, client_ip):
        return  # Kết nối bị từ chối do giới hạn IP

    redis_client = get_redis()

    try:
        # Gửi danh sách người dùng
        await websocket.send_json({"type": "users", "users": list(manager.active_connections.keys())})

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received WebSocket data: {message}")

            if message.get("type") in ["message", "sticker"]:
                room_id = message.get("roomId")
                if not room_id:
                    continue  # Bỏ qua nếu không có roomId

                msg = {
                    "type": message["type"],
                    "username": username,
                    "content": message["content"],
                    "timestamp": message.get("timestamp", datetime.utcnow().isoformat())
                }
                # Lưu tin nhắn vào Redis theo roomId
                room_channel = f"{REDIS_CHANNEL}:{room_id}"
                await redis_client.rpush(room_channel, json.dumps(msg))
                # Gửi tin nhắn đến tất cả người dùng trong phòng
                for user, ws in manager.active_connections.items():
                    try:
                        await ws.send_json(msg)
                    except Exception as e:
                        print(f"Failed to send message to {user}: {e}")
            else:
                print(f"Ignored message with type: {message.get('type')}")

    except WebSocketDisconnect:
        await manager.disconnect(username, client_ip)
    except Exception as e:
        await manager.disconnect(username, client_ip)
        print(f"WebSocket error: {e}")