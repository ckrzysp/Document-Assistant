# Pydantic Models for each endpoint (Both Request & Response)
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    language: str | None = None

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
    language: str | None =None

class SendMessageResponse(BaseModel):
    message: str
    response: str

class DocumentResponse(BaseModel):
    id: int
    filename: str
    media_type: str
    has_translation: bool  # Whether a translated version exists

class UpdateUserRequest(BaseModel):
    user_id: int
    name: str | None = None
    email: EmailStr | None = None
    current_password: str | None = None  # Required if changing password
    new_password: str | None = None
    language: str | None = None

class UpdateUserResponse(BaseModel):
    success: bool
    message: str