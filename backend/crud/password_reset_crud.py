from datetime import datetime
from sqlalchemy.orm import Session

from tables import PasswordResetToken


class PasswordResetCRUD:
    @staticmethod
    def create_token(db: Session, user_id: int, token: str, expires_at: datetime) -> PasswordResetToken:
        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
            used=False
        )
        db.add(reset_token)
        db.commit()
        db.refresh(reset_token)
        return reset_token

    @staticmethod
    def get_valid_token(db: Session, token: str, user_id: int | None = None) -> PasswordResetToken | None:
        query = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token,
            PasswordResetToken.used.is_(False)
        )
        if user_id is not None:
            query = query.filter(PasswordResetToken.user_id == user_id)

        reset_token = query.first()
        if not reset_token:
            return None

        if reset_token.expires_at < datetime.utcnow():
            return None

        return reset_token

    @staticmethod
    def mark_token_used(db: Session, password_reset_token: PasswordResetToken) -> PasswordResetToken:
        password_reset_token.used = True
        db.commit()
        db.refresh(password_reset_token)
        return password_reset_token
