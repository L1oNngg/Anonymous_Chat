# ./main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from redis_client import init_redis
from routers.websocket import websocket_router
from routers.chat_api import api_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

@app.on_event("startup")
async def startup():
    await init_redis()

# Include routers
app.include_router(api_router)
app.include_router(websocket_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)