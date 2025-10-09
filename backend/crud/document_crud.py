from sqlalchemy.orm import Session
from tables import Document
from typing import List, Optional

class DocumentCRUD:
    @staticmethod
    def create(db : Session, user_id : int, text : str, file_info : dict) -> Document:
        document = Document(user_id=user_id, text=text, file_info=file_info)
        db.add(document)
        db.commit()
        db.refresh(document)
        return document

    @staticmethod
    def get_by_id(db: Session, document_id: int) -> Optional[Document]:
        return db.query(Document).filter(Document.id == document_id).first()
    
    @staticmethod
    def add_file_paths(db : Session, document_id: int, original_file_path : str, translated_file_path : str) -> bool
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.original_file_path = original_file_path
            document.translated_file_path = translated_file_path
            db.commit()
            db.refresh(document)

    @staticmethod
    def add_text(db : Session, document_id : int, text : str):
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.text = text
            db.commit()
            db.refresh(document)

    @staticmethod
    def delete(db: Session, document_id: int) -> bool:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            db.delete(document)
            db.commit()
            return True
        return False
