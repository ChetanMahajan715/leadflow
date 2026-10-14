from datetime import UTC, datetime

from sqlalchemy import DateTime, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.types import TypeDecorator

from app.config import settings


def utcnow() -> datetime:
    return datetime.now(UTC)


class UTCDateTime(TypeDecorator):
    """Saves timezone-aware datetimes as plain UTC and gives them back as aware UTC.

    This is the SQLAlchemy docs recipe. It behaves the same on SQLite (which has
    no timezone support) and Postgres.
    """

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("datetime must be timezone-aware")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return value.replace(tzinfo=UTC)


connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: one database session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
