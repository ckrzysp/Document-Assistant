from sqlalchemy.orm import Session
from tables import Message
from typing import List, Optional

class MessageCRUD:
    @staticmethod
    def create(db : Session, chat_id : int, role : str, content : str) -> Message:
        message = Message(chat_id=chat_id, role=role, content=content)
        db.add(message)
        db.commit()
        db.refresh(message)

    @staticmethod
    def get_by_id(db: Session, message_id: int) -> Optional[Message]:
        return db.query(Message).filter(Message.id == message_id).first()

    @staticmethod
    def delete(db: Session, message_id: int) -> bool:
        message = db.query(Message).filter(Message.id == message_id).first()
        if message:
            db.delete(message)
            db.commit()
            return True
        return False
