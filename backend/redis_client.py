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
