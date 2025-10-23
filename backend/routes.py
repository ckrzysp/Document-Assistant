# Endpoint Code
from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import database, engine
from schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, SendMessageRequest, SendMessageResponse, DocumentResponse
from crud.user_crud import UserCRUD
from crud.document_crud import DocumentCRUD
from crud.message_crud import MessageCRUD
from crud.chat_crud import ChatCRUD
from passlib.context import CryptContext
from contextlib import asynccontextmanager
from helpers import saveFile, get_gpt_response_with_context, check_logic_with_gemini


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    document = DocumentCRUD.create(db=db, user_id=user_id, file_info=file_info)

    original_file_path = await saveFile(file=file, user_id=user_id, document_id=document.id, type="original")

    # TO DO: Implementation of translating the document
    translated_file_path = ""  # Placeholder for now
    # translated_file_path = await saveFile(file=translated_file, user_id=user_id, document_id=document.id, type="translated")

    DocumentCRUD.add_file_paths(db=db, document_id=document.id, original_file_path=original_file_path, translated_file_path=translated_file_path)

    # TO DO: Add functionality for text extraction
    text = ""

    DocumentCRUD.add_text(db=db, document_id=document.id, text=text)

    chat = ChatCRUD.create(db=db, user_id=user_id, document_id=document.id, chat_name=name)

    return {"chat_id": chat.id}

@app.post("/send_message")
def send_message(request : SendMessageRequest, db : Session = Depends(get_db)):
    chat_id = request.chat_id
    user_message = request.text

    # Update Message Table & Chat Session History
    MessageCRUD.create(db=db, chat_id=chat_id, role="user", content=user_message)

    chat = ChatCRUD.updateChat(db=db, chat_id=chat_id, message=user_message, role="user")

    gemini_approved = False
    gpt_response=""
    retries = 0
    # Get Response from GPT
    while not gemini_approved and retries < 5:

        gpt_response = get_gpt_response_with_context(chat.message_history, chat.document.text)

        content = user_message + " " + gpt_response

        gemini_approved = check_logic_with_gemini(content=content, document_text=chat.document.text)

        retries += 1
    
    if not gemini_approved and retries >= 5:
        # No consistence was reached between the two models
        gpt_response = "Unable to answer this question."

    # Add GPT Message to Messages and Update the Chat (should also work for when nothing is found)
    MessageCRUD.create(db=db, chat_id=chat_id, role="assistant", content=gpt_response)

    chat = ChatCRUD.updateChat(db=db, chat_id=chat_id, message=gpt_response, role="assistant")

    # Return the message
    return gpt_response

@app.get("/documents/{user_id}", response_model=list[DocumentResponse])
def get_documents(user_id: int, db: Session = Depends(get_db)):
    user = UserCRUD.get_by_id(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return [
        DocumentResponse(
            id=doc.id,
            filename=doc.file_info.get("filename", ""),
            media_type=doc.file_info.get("media_type", ""),
            has_translation=bool(doc.translated_file_path and doc.translated_file_path.strip())
        )
        for doc in user.documents
    ]

@app.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    version: str = "original",  # "original" or "translated"
    db: Session = Depends(get_db)
):
    """
    Download a document file.

    Args:
        document_id: The document ID
        version: "original" or "translated" (default: "original")
    """
    document = DocumentCRUD.get_by_id(db=db, document_id=document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Determine which file path to use
    if version == "translated":
        file_path = document.translated_file_path
        if not file_path or not file_path.strip():
            raise HTTPException(status_code=404, detail="Translated version not available")
        filename_prefix = "translated_"
    else:  # default to original
        file_path = document.original_file_path
        if not file_path:
            raise HTTPException(status_code=404, detail="Original file not found")
        filename_prefix = ""

    return FileResponse(
        path=file_path,
        filename=f"{filename_prefix}{document.file_info.get('filename', 'download')}",
        media_type=document.file_info.get("media_type", "application/octet-stream")
    )

# Get user chats
@app.get("/chats/{user_id}")
def get_user_chats(user_id: int, db: Session = Depends(get_db)):
    user = UserCRUD.get_by_id(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return [
        {
            'id': chat.id,
            'document_id': chat.document_id,
            'document_name': chat.document.file_info.get('filename', ''),
            'title': chat.name or f'Chat {chat.id}',
            'message_count': len(chat.message_history) if chat.message_history else 0
        }
        for chat in user.chats
    ]

# Get chat messages
@app.get("/chat/{chat_id}")
def get_chat(chat_id: int, db: Session = Depends(get_db)):
    chat = ChatCRUD.get_by_id(db=db, chat_id=chat_id)
    
    if not chat:
        raise HTTPException(status_code=404, detail='Chat not found')
    
    return {
        'id': chat.id,
        'document_id': chat.document_id,
        'document_name': chat.document.file_info.get('filename', ''),
        'title': chat.name or f'Chat {chat.id}',
        'messages': chat.message_history
    }




