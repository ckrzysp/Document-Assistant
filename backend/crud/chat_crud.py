from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from tables import Chat
from typing import List, Optional

class ChatCRUD:
    @staticmethod
    def create(db : Session, user_id : int, document_id : int, chat_name : str) -> Chat:
        chat = Chat(user_id=user_id, document_id=document_id, name=chat_name)
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return chat

    @staticmethod
    def get_by_id(db: Session, chat_id: int) -> Optional[Chat]:
        return db.query(Chat).filter(Chat.id == chat_id).first()
    
    @staticmethod
    def updateChat(db : Session, chat_id: int, message : str, role : str):
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            previousMessages = chat.message_history if chat.message_history else []
            previousMessages.append({
                "role" : role,
                "content" : message,
            })
            chat.message_history = previousMessages
            flag_modified(chat, "message_history")  # Tell SQLAlchemy the JSON field changed
            db.commit()
            db.refresh(chat)
            return chat

    @staticmethod
    def delete(db: Session, chat_id: int) -> bool:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            db.delete(chat)
            db.commit()
            return True
        return False
