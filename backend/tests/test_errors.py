from fastapi.testclient import TestClient

from app import crud
from app.main import app


def test_unexpected_error_returns_generic_500_with_cors(client, monkeypatch):
    def boom(*args, **kwargs):
        raise RuntimeError("secret database detail")

    monkeypatch.setattr(crud, "list_leads", boom)
    # raise_server_exceptions=False: behave like a real server instead of
    # re-raising in the test. The `client` fixture still provides the test DB.
    server = TestClient(app, raise_server_exceptions=False)
    r = server.get("/api/leads", headers={"Origin": "http://localhost:3000"})

    assert r.status_code == 500
    assert r.json() == {"detail": "Internal server error"}
    assert "secret" not in r.text
    # Without this header the browser hides the 500 behind a CORS error.
    assert r.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_huge_lead_id_is_422_not_500(client):
    assert client.get("/api/leads/99999999999999999999").status_code == 422
