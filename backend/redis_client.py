# ./redis_client.py
import redis.asyncio as redis
from config import REDIS_HOST, REDIS_PORT
import logging

redis_client: redis.Redis = None

async def init_redis():
    global redis_client
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    await redis_client.ping()

def get_redis():
    return redis_client

# Quản lý số lượng kết nối theo IP
async def increment_ip_connection(ip: str, max_connections: int = 2) -> bool:
    """Tăng số kết nối cho IP và kiểm tra giới hạn."""
    redis = get_redis()
    key = f"ip_limit:{ip}"
    current_count = await redis.get(key)
    if current_count is None:
        current_count = 0
    else:
        current_count = int(current_count)

    if current_count >= max_connections:
        return False  # Vượt quá giới hạn

    await redis.incr(key)
    await redis.expire(key, 3600)  # Hết hạn sau 1 giờ
    return True

async def decrement_ip_connection(ip: str):
    """Giảm số kết nối khi ngắt kết nối."""
    redis = get_redis()
    key = f"ip_limit:{ip}"
    await redis.decr(key)
    current_count = await redis.get(key)
    if current_count and int(current_count) <= 0:
        await redis.delete(key)  # Xóa key nếu không còn kết nối