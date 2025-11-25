from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from tables import Chat, Message
from typing import List, Optional
from sqlalchemy import func

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
    def update_chat(db : Session, chat_id: int, message : str, role : str):
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            message_history = chat.message_history or []
            message_history.append({
                "role": role,
                "content": message,
            })
            chat.message_history = message_history
            flag_modified(chat, "message_history")  # Tell SQLAlchemy the JSON field changed
            db.commit()
            db.refresh(chat)
            return chat

    @staticmethod
    def delete(db: Session, chat_id: int) -> bool:
        # Remove messages tied to the chat first to avoid FK issues
        db.query(Message).filter(Message.chat_id == chat_id).delete()

        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            db.delete(chat)
            db.commit()
            return True
        db.commit()
        return False

    @staticmethod
    def generate_chat_name(db: Session, user_id: int, document_id: int, base_name: str) -> str:
        existing_names = {
            chat.name for chat in db.query(Chat).filter(
                Chat.user_id == user_id,
                Chat.document_id == document_id
            )
        }
        if base_name not in existing_names:
            return base_name
        suffix = 2
        candidate = f"{base_name} ({suffix})"
        while candidate in existing_names:
            suffix += 1
            candidate = f"{base_name} ({suffix})"
        return candidate

    @staticmethod
    def update_name(db: Session, chat_id: int, name: str) -> Optional[Chat]:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            return None
        chat.name = name
        db.commit()
        db.refresh(chat)
        return chat
