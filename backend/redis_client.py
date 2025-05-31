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
    if redis_client is None:
        raise RuntimeError("Redis client not initialized")
    return redis_client

async def add_user_to_ip(ip: str, username: str, max_connections: int = 2) -> bool:
    """Thêm username vào danh sách người dùng của IP và kiểm tra giới hạn."""
    redis = get_redis()
    key = f"ip_users:{ip}"
    # Lấy danh sách người dùng hiện tại
    current_users = await redis.lrange(key, 0, -1)
    current_count = len(current_users)

    if current_count >= max_connections:
        logging.warning(f"IP {ip} has reached max connections ({max_connections})")
        return False  # Vượt quá giới hạn

    # Thêm username vào danh sách
    await redis.lpush(key, username)
    await redis.expire(key, 3600)  # Hết hạn sau 1 giờ
    logging.info(f"Added {username} to IP {ip}. Current users: {current_count + 1}")
    return True

async def remove_user_from_ip(ip: str, username: str):
    """Xóa username khỏi danh sách người dùng của IP."""
    redis = get_redis()
    key = f"ip_users:{ip}"
    # Xóa username khỏi danh sách
    await redis.lrem(key, 1, username)
    current_users = await redis.lrange(key, 0, -1)
    if not current_users:
        await redis.delete(key)  # Xóa key nếu không còn người dùng
    logging.info(f"Removed {username} from IP {ip}. Remaining users: {len(current_users)}")

async def get_users_for_ip(ip: str) -> list:
    """Lấy danh sách người dùng hiện tại cho IP."""
    redis = get_redis()
    key = f"ip_users:{ip}"
    return await redis.lrange(key, 0, -1)