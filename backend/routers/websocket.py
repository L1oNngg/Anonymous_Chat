# ./routers/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from redis_client import get_redis
from config import REDIS_CHANNEL
from manager import manager
from datetime import datetime
from utils.jwt_utils import decode_jwt

websocket_router = APIRouter()

@websocket_router.websocket("/ws/chat/{username}")
async def chat_ws(websocket: WebSocket, username: str):
    # Lấy IP thật nếu có, nếu không thì dùng username làm IP (dev mode)
    client_ip = websocket.headers.get("X-Forwarded-For")
    if not client_ip or client_ip == "unknown":
        client_ip = username
    session_id = websocket.query_params.get("sessionId", "")
    room_id = websocket.query_params.get("roomId", "1")  # Lấy roomId từ query params, mặc định là "1"
    # Xác thực JWT thay vì sessionId truyền thống
    jwt_data = decode_jwt(session_id)
    if not jwt_data or jwt_data.get("sub") != username:
        await websocket.close(code=1008, reason="Invalid session ID")
        print(f"Rejected WebSocket connection for {username}: Invalid session ID")
        return

    # Đảm bảo sessionId có trong manager.sessions để các hàm connect/disconnect không bị lỗi
    if username not in manager.sessions:
        manager.sessions[username] = {}
    if session_id not in manager.sessions[username]:
        manager.sessions[username][session_id] = username

    if not await manager.connect(websocket, username, client_ip, room_id):
        return

    redis_client = get_redis()

    try:
        # Gửi sessionId khi kết nối thành công
        await websocket.send_json({"type": "session", "sessionId": session_id})

        # Lấy danh sách người dùng online trong phòng
        active_users = set()
        for session_users in manager.active_connections.get(room_id, {}).values():
            active_users.update(session_users.keys())
        await websocket.send_json({"type": "users", "users": list(active_users)})

        # Gửi lịch sử tin nhắn
        room_channel = f"{REDIS_CHANNEL}:{room_id}"
        messages_raw = await redis_client.lrange(room_channel, 0, -1)
        messages = [json.loads(m) for m in messages_raw if json.loads(m).get("type") in ["message", "sticker"]]
        await websocket.send_json({"type": "history", "messages": messages})

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"Received WebSocket data: {message}")

            if message.get("type") in ["message", "sticker"]:
                room_id = message.get("roomId", room_id)
                msg = {
                    "type": message["type"],
                    "username": username,
                    "content": message["content"],
                    "roomId": room_id,
                    "timestamp": message.get("timestamp", datetime.utcnow().isoformat())
                }
                room_channel = f"{REDIS_CHANNEL}:{room_id}"
                await redis_client.rpush(room_channel, json.dumps(msg))
                await manager.broadcast(msg, room_id)
                print(f"Broadcast message to room {room_id}: {msg}")
            elif message.get("type") == "publicKey":
                room_id = message.get("roomId", room_id)
                public_key_msg = {
                    "type": "publicKey",
                    "username": username,
                    "publicKey": message["publicKey"],
                    "roomId": room_id
                }
                manager.store_public_key(username, message["publicKey"])  # Lưu trữ publicKey
                await manager.broadcast(public_key_msg, room_id)
                print(f"Broadcast publicKey for {username} to room {room_id}: {public_key_msg}")
            else:
                print(f"Ignored message with type: {message.get('type')}")

    except WebSocketDisconnect as e:
        print(f"WebSocket disconnected for {username}: {e}")
        await manager.disconnect(websocket, username, client_ip, room_id)
    except Exception as e:
        print(f"WebSocket error for {username}: {e}")
        await manager.disconnect(websocket, username, client_ip, room_id)