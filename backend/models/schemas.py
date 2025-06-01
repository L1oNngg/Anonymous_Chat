from typing import Optional
from pydantic import BaseModel

class Content(BaseModel):
    text: Optional[str] = None
    emoji: Optional[str] = None
    sticker_id: Optional[str] = None  # Đổi từ int sang str

class SendMessageRequest(BaseModel):
    username: str
    content: Content
    roomId: int
    type: str

