# Endpoint Code
from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import database, engine
from schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, SendMessageRequest, SendMessageResponse, DocumentResponse, UpdateUserRequest, UpdateUserResponse, UpdateChatRequest, CreateChatFromDocumentRequest, DeleteDocumentResponse
from crud.user_crud import UserCRUD
from crud.document_crud import DocumentCRUD
from crud.message_crud import MessageCRUD
from crud.chat_crud import ChatCRUD
from passlib.context import CryptContext
from contextlib import asynccontextmanager
from helpers import saveFile, get_gpt_response_with_context, check_logic_with_gemini
import requests
import secrets
import os


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

# Google OAuth configuration
GOOGLE_CLIENT_ID = "763420082617-j42eaoshh28sv6dncameph7gjqhei4qc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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" 

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

    user = UserCRUD.create(db=db, name=request.name, email=request.email, hashed_password=hashed_password, language=request.language)
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

@app.get("/user/{user_id}")
def get_user_info(user_id: int, db: Session = Depends(get_db)):
    user = UserCRUD.get_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "language": user.language
    }

@app.post("/google-auth")
async def google_auth(request: dict, db: Session = Depends(get_db)):
    """Handle Google OAuth login/signup"""
    try:
        code = request.get('code')
        if not code:
            raise HTTPException(status_code=422, detail="Authorization code required")

        # Exchange code for tokens
        token_data = {
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': request.get('redirect_uri', 'http://localhost:3000/login')
        }

        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data=token_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        if token_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to verify with Google")

        tokens = token_resp.json()
        id_token = tokens.get('id_token')
        
        # Verify ID token
        token_verify = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        )
        
        if token_verify.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        token_data = token_verify.json()

        # Check token audience
        if token_data.get('aud') != GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_email = token_data.get('email')
        if not user_email:
            raise HTTPException(status_code=401, detail="No email in token")

        user_info = {
            'email': user_email,
            'name': token_data.get('name', user_email.split('@')[0])
        }

        # Check if user exists
        user = UserCRUD.get_by_email(db=db, email=user_info['email'])
        
        if user:
            # Existing user login
            return {
                "success": True,
                "user_id": user.id,
                "is_new_user": False,
                "user_email": user.email,
                "user_name": user.name
            }
        else:
            # New user - create account
            temp_password = pwd_context.hash("temp_setup_required")
            
            new_user = UserCRUD.create(
                db=db, 
                name=user_info['name'], 
                email=user_info['email'], 
                hashed_password=temp_password, 
                language='en'
            )
            
            return {
                "success": True,
                "user_id": new_user.id,
                "is_new_user": True,
                "needs_password_setup": True,
                "user_email": new_user.email,
                "user_name": new_user.name
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Google authentication failed")

# Set password for OAuth users
@app.post("/set-password")
async def set_password(
    user_id: int = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = UserCRUD.get_by_id(db=db, user_id=user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    hashed_password = pwd_context.hash(password)
    UserCRUD.update(db=db, user_id=user_id, hashed_password=hashed_password)
    
    return {
        "success": True,
        "message": "Password set successfully"
    }

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

    chat_name = ChatCRUD.generate_chat_name(db=db, user_id=user_id, document_id=document.id, base_name=name)
    chat = ChatCRUD.create(db=db, user_id=user_id, document_id=document.id, chat_name=chat_name)

    return {"chat_id": chat.id}

@app.post("/send_message")
def send_message(request : SendMessageRequest, db : Session = Depends(get_db)):
    chat_id = request.chat_id
    user_message = request.text

    chat = ChatCRUD.get_by_id(db=db, chat_id=chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found. Please upload a document first to start a chat.")

    # Update Message Table & Chat Session History
    MessageCRUD.create(db=db, chat_id=chat_id, role="user", content=user_message)

    chat = ChatCRUD.update_chat(db=db, chat_id=chat_id, message=user_message, role="user")

    gemini_approved = False
    gpt_response=""
    retries = 0
    # Get Response from GPT
    while not gemini_approved and retries < 5:

        gpt_response = get_gpt_response_with_context(chat.message_history, chat.document.text, language=request.language)

        content = user_message + " " + gpt_response

        gemini_approved = check_logic_with_gemini(content=content, document_text=chat.document.text, language=request.language)

        retries += 1
    
    if not gemini_approved and retries >= 5:
        # No consistence was reached between the two models
        gpt_response = "Unable to answer this question."

    # Add GPT Message to Messages and Update the Chat (should also work for when nothing is found)
    MessageCRUD.create(db=db, chat_id=chat_id, role="assistant", content=gpt_response)

    chat = ChatCRUD.update_chat(db=db, chat_id=chat_id, message=gpt_response, role="assistant")

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

@app.put("/chat/{chat_id}")
def update_chat(chat_id: int, request: UpdateChatRequest, db: Session = Depends(get_db)):
    if not request.name or not request.name.strip():
        raise HTTPException(status_code=400, detail="Chat name is required")

    chat = ChatCRUD.update_name(db=db, chat_id=chat_id, name=request.name.strip())
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return {
        "success": True,
        "message": "Chat renamed successfully",
        "chat_id": chat.id,
        "name": chat.name
    }

@app.delete("/chat/{chat_id}")
def delete_chat(chat_id: int, db: Session = Depends(get_db)):
    deleted = ChatCRUD.delete(db=db, chat_id=chat_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return {"success": True, "message": "Chat deleted successfully"}

@app.delete("/documents/{document_id}", response_model=DeleteDocumentResponse)
def delete_document(document_id: int, user_id: int, db: Session = Depends(get_db)):
    document = DocumentCRUD.get_by_id(db=db, document_id=document_id)
    if not document or document.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found")

    # delete related chats/messages
    for chat in document.chats:
        ChatCRUD.delete(db=db, chat_id=chat.id)

    deleted = DocumentCRUD.delete(db=db, document_id=document_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete document")

    return DeleteDocumentResponse(success=True, message="Document deleted successfully")

@app.post("/create_chat_from_document")
def create_chat_from_document(request: CreateChatFromDocumentRequest, db: Session = Depends(get_db)):
    document = DocumentCRUD.get_by_id(db=db, document_id=request.document_id)
    if not document or document.user_id != request.user_id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    base_name = request.name or document.file_info.get("filename", "Chat")
    chat_name = ChatCRUD.generate_chat_name(db=db, user_id=request.user_id, document_id=document.id, base_name=base_name)
    chat = ChatCRUD.create(db=db, user_id=request.user_id, document_id=document.id, chat_name=chat_name)
    
    return {
        "chat_id": chat.id,
        "document_name": document.file_info.get("filename", ""),
        "chat_name": chat.name
    }

@app.put("/update_user", response_model=UpdateUserResponse)
def update_user_info(request: UpdateUserRequest, db: Session = Depends(get_db)):
    user = UserCRUD.get_by_id(db=db, user_id=request.user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prepare update data
    update_data = {}

    # Handle password change
    if request.new_password:
        # Password change requires current password verification
        if not request.current_password:
            raise HTTPException(
                status_code=400,
                detail="Current password is required to set a new password"
            )

        # Verify current password
        if not pwd_context.verify(request.current_password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

        # Hash and set new password
        update_data['hashed_password'] = pwd_context.hash(request.new_password)

    if request.name is not None:
        update_data['name'] = request.name

    if request.email is not None:
        existing_user = UserCRUD.get_by_email(db=db, email=request.email)
        if existing_user and existing_user.id != request.user_id:
            raise HTTPException(status_code=400, detail="Email is already used by another account")
        update_data['email'] = request.email

    if request.language is not None:
        update_data['language'] = request.language

    if update_data:
        UserCRUD.update(db=db, user_id=request.user_id, **update_data)
        return UpdateUserResponse(success=True, message="User information updated successfully")
    else:
        return UpdateUserResponse(success=True, message="No changes were made")