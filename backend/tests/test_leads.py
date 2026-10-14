from datetime import UTC, datetime, timedelta

from app.models import Lead, LeadStatus


def make_lead(client, **fields):
    r = client.post("/api/leads", json={"name": "Asha Rao", **fields})
    assert r.status_code == 201, r.text
    return r.json()


# --- create ---


def test_create_lead_defaults(client):
    lead = make_lead(client, company="Rao Wealth", phone="+91 98200 11111")
    assert lead["name"] == "Asha Rao"
    assert lead["company"] == "Rao Wealth"
    assert lead["status"] == "new"
    assert lead["follow_up_at"] is None
    assert lead["last_note"] == "Lead created via web form."
    assert lead["last_note_at"] is not None


def test_create_lead_trims_and_blanks_become_null(client):
    lead = make_lead(client, name="  Asha Rao  ", company="   ", phone="")
    assert lead["name"] == "Asha Rao"
    assert lead["company"] is None
    assert lead["phone"] is None


def test_create_lead_requires_name(client):
    for body in ({}, {"name": ""}, {"name": "   "}):
        r = client.post("/api/leads", json=body)
        assert r.status_code == 422
        assert r.json()["detail"][0]["loc"][-1] == "name"


def test_create_lead_rejects_too_long_fields(client):
    assert client.post("/api/leads", json={"name": "A" * 101}).status_code == 422
    assert (
        client.post("/api/leads", json={"name": "A", "phone": "1" * 31}).status_code
        == 422
    )


# --- list ---


def test_list_leads_filters_by_status_and_searches_by_name(client, db):
    asha = make_lead(client)
    make_lead(client, name="Vikram Shah")
    lead = db.get(Lead, asha["id"])
    lead.status = LeadStatus.won
    # Set the time explicitly: two writes in the same clock tick would tie.
    lead.updated_at = datetime.now(UTC) + timedelta(minutes=1)
    db.commit()

    # most recently active first
    assert [x["name"] for x in client.get("/api/leads").json()] == [
        "Asha Rao",
        "Vikram Shah",
    ]
    assert [x["name"] for x in client.get("/api/leads?status=won").json()] == [
        "Asha Rao"
    ]
    assert [x["name"] for x in client.get("/api/leads?search=VIK").json()] == [
        "Vikram Shah"
    ]
    assert client.get("/api/leads?status=new&search=asha").json() == []


def test_list_rejects_unknown_status(client):
    assert client.get("/api/leads?status=bogus").status_code == 422


# --- get ---


def test_get_lead(client):
    lead = make_lead(client)
    r = client.get(f"/api/leads/{lead['id']}")
    assert r.status_code == 200
    assert r.json()["name"] == "Asha Rao"


def test_get_missing_lead_404(client):
    r = client.get("/api/leads/999")
    assert r.status_code == 404
    assert r.json() == {"detail": "Lead not found"}


# --- update ---


def test_patch_status_persists(client):
    lead = make_lead(client)
    r = client.patch(f"/api/leads/{lead['id']}", json={"status": "qualified"})
    assert r.status_code == 200
    assert r.json()["status"] == "qualified"
    assert client.get(f"/api/leads/{lead['id']}").json()["status"] == "qualified"


def test_patch_only_changes_sent_fields(client):
    lead = make_lead(client, company="Rao Wealth")
    r = client.patch(f"/api/leads/{lead['id']}", json={"phone": "555"})
    assert r.json()["company"] == "Rao Wealth"
    assert r.json()["phone"] == "555"


def test_patch_rejects_bad_values(client):
    lead = make_lead(client)
    url = f"/api/leads/{lead['id']}"
    assert client.patch(url, json={"status": "x"}).status_code == 422
    assert client.patch(url, json={"name": None}).status_code == 422
    assert client.patch(url, json={"status": None}).status_code == 422
    assert (
        client.patch(url, json={"follow_up_at": "2030-01-01T10:00:00"}).status_code
        == 422
    )


def test_patch_missing_lead_404(client):
    assert client.patch("/api/leads/999", json={"status": "won"}).status_code == 404


# --- delete ---


def test_delete_lead(client):
    lead = make_lead(client)
    r = client.delete(f"/api/leads/{lead['id']}")
    assert r.status_code == 204
    assert r.content == b""
    assert client.get(f"/api/leads/{lead['id']}").status_code == 404
    assert client.delete(f"/api/leads/{lead['id']}").status_code == 404


def test_search_treats_wildcards_as_plain_text(client):
    make_lead(client, name="a_b")
    make_lead(client, name="axb")
    assert [x["name"] for x in client.get("/api/leads?search=_").json()] == ["a_b"]
    assert client.get("/api/leads?search=%25").json() == []  # a literal %
