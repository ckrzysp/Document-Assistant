# Endpoint Code
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import database, engine
from schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from crud.user_crud import UserCRUD
from passlib.context import CryptContext
from crud.user_crud import UserCRUD
from contextlib import asynccontextmanager


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