# Pydantic Models for each endpoint (Both Request & Response)
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class RegisterResponse(BaseModel):
    message: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: int | None = None

class SendMessageRequest(BaseModel):
    chat_id: int
    text: str

class SendMessageResponse(BaseModel):
    message: str
    response: str

class DocumentResponse(BaseModel):
    id: int
    filename: str
    media_type: str
    has_translation: bool  # Whether a translated version exists