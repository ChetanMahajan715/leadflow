from fastapi.testclient import TestClient

from app import crud
from app.database import get_db
from app.main import app


def test_unexpected_error_returns_generic_500(db, monkeypatch):
    def boom(*args, **kwargs):
        raise RuntimeError("secret database detail")

    monkeypatch.setattr(crud, "list_leads", boom)
    app.dependency_overrides[get_db] = lambda: db
    # raise_server_exceptions=False: behave like a real server instead of re-raising in the test
    with TestClient(app, raise_server_exceptions=False) as client:
        r = client.get("/api/leads")
    app.dependency_overrides.clear()

    assert r.status_code == 500
    assert r.json() == {"detail": "Internal server error"}
    assert "secret" not in r.text
