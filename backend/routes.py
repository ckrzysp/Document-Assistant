# Endpoint Code
from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from database import database, engine
from schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from crud.user_crud import UserCRUD
from crud.document_crud import DocumentCRUD
from crud.message_crud import MessageCRUD
from crud.chat_crud import ChatCRUD
from passlib.context import CryptContext
from contextlib import asynccontextmanager
from helpers import saveFile


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_db():
    db = Session(bind=engine)
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=RegisterResponse)
async def register(request : RegisterRequest, db : Session = Depends(get_db)):
    user = UserCRUD.get_by_email(db=db, email=request.email)

    if user:
        raise HTTPException(status_code=400, detail="Email is already used.")

    hashed_password = pwd_context.hash(request.password)
    await UserCRUD.create(db=db, name=request.name, email=request.email, hashed_password=hashed_password)
    return {"message" : "User created successfully"}


@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = UserCRUD.get_by_email(db=db, email=request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if pwd_context.verify(request.password, user.hashed_password):
        return LoginResponse(
            success=True,
            message="Login successful",
            user_id=user.id
        )
    else:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/create_chat")
async def create_chat(
    user_id: int = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_info = {
        "filename": file.filename,
        "media_type": file.content_type
    }

    document = DocumentCRUD.create(db=db, user_id=user_id, original_file_path="", translated_file_path="", file_info=file_info)

    original_file_path = saveFile(file=file, user_id=user_id, document_id=document.id, type="original")

    # TO DO: Implementation of translating the document
    translated_file = ""
    translated_file_path = saveFile(file=translated_file, user_id=user_id, document_id=document.id, type="translated")

    DocumentCRUD.add_file_paths(db=db, document_id=document.id, original_file_path=original_file_path, translated_file_path=translated_file_path)

    # TO DO: Add functionality for text extraction
    text = ""

    DocumentCRUD.add_text(db=db, document_id=document.id, text=text)

    chat = ChatCRUD.create(db=db, user_id=user_id, document_id=document.id, chat_name=name)

    return {"chat_id": chat.id}

# @app.post("/send_message")
# def send_message(request : SendMessageRequest, db : Session = Depends(get_db)):
#     user_id = request.user_id
#     chat_id = request.chat_id

#     MessageCRUD.create(db=db, chat_id=chat_id, role="user", context=request.text)

#     ChatCRUD.updateChat(db=db, chat_id=chat_id, message=request.text, role="user")




