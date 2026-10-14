import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def db():
    """A fresh in-memory SQLite database for each test."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


@pytest.fixture
def client(db):
    """A TestClient whose requests use the test database instead of the real one."""
    app.dependency_overrides[get_db] = lambda: db
    # Not `with TestClient(app)`: that would run the app's startup, which creates
    # tables in the real database. The `db` fixture already made the test tables.
    yield TestClient(app)
    app.dependency_overrides.clear()
