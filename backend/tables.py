from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    documents = relationship("Document", back_populates="owner")
    chats = relationship("Chat", back_populates="owner")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    text = Column(Text, nullable=False, index=True)
    # original_bytes = Column(String(100), unique=True, index=True, nullable=False)
    # translated_bytes = Column(String(100), unique=True, index=True, nullable=False)
    file_info = Column(JSON, default=dict)

    owner = relationship("User", back_populates="documents")
    chats = relationship("Chat", back_populates="document")

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    messages = Column(JSON, default=list)

    owner = relationship("User", back_populates="chats")
    document = relationship("Document", back_populates="chats")
    messages = relationship("Message", back_populates="chat")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    role = Column(String(100), index=True, nullable=False)
    content = Column(Text, index=True, nullable=False)

    chat = relationship("Chat", back_populates="messages")