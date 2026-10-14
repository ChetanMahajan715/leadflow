from datetime import UTC, datetime, timedelta

from app import crud
from app.models import Lead
from app.schemas import DiscussionCreate
from tests.test_leads import make_lead


def add_note(client, lead_id, note, follow_up_at=None):
    body = {"note": note}
    if follow_up_at is not None:
        body["follow_up_at"] = follow_up_at.isoformat()
    return client.post(f"/api/leads/{lead_id}/discussions", json=body)


# --- timeline ---


def test_timeline_is_newest_first(client):
    lead = make_lead(client)
    add_note(client, lead["id"], "First call")
    add_note(client, lead["id"], "Second call")
    r = client.get(f"/api/leads/{lead['id']}/discussions")
    assert r.status_code == 200
    assert [d["note"] for d in r.json()] == [
        "Second call",
        "First call",
        "Lead created via web form.",
    ]


def test_timeline_missing_lead_404(client):
    assert client.get("/api/leads/999/discussions").status_code == 404


# --- add a note ---


def test_add_note_returns_discussion_and_updated_lead(client):
    lead = make_lead(client)
    r = add_note(client, lead["id"], "  Sent the proposal  ")
    assert r.status_code == 201
    body = r.json()
    assert body["discussion"]["note"] == "Sent the proposal"
    assert body["discussion"]["lead_id"] == lead["id"]
    assert body["lead"]["last_note"] == "Sent the proposal"
    assert body["lead"]["last_note_at"] == body["discussion"]["created_at"]


def test_note_with_follow_up_sets_lead_follow_up(client):
    lead = make_lead(client)
    when = datetime.now(UTC) + timedelta(days=1)
    body = add_note(client, lead["id"], "Call back tomorrow", when).json()
    assert datetime.fromisoformat(body["discussion"]["follow_up_at"]) == when
    assert datetime.fromisoformat(body["lead"]["follow_up_at"]) == when
    # and it is saved, not just echoed back
    saved = client.get(f"/api/leads/{lead['id']}").json()
    assert datetime.fromisoformat(saved["follow_up_at"]) == when


def test_add_note_validation(client):
    lead = make_lead(client)
    assert add_note(client, lead["id"], "   ").status_code == 422
    assert add_note(client, lead["id"], "x" * 2001).status_code == 422
    r = client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "x", "follow_up_at": "2030-01-01T10:00:00"},  # no timezone
    )
    assert r.status_code == 422


def test_follow_up_in_the_past_is_rejected(client):
    lead = make_lead(client)
    r = add_note(client, lead["id"], "x", datetime.now(UTC) - timedelta(minutes=5))
    assert r.status_code == 422
    assert r.json()["detail"][0]["loc"][-1] == "follow_up_at"


def test_add_note_missing_lead_404(client):
    assert add_note(client, 999, "x").status_code == 404


# --- follow-up rule: a note WITHOUT a follow-up ---


def test_note_without_follow_up_keeps_a_future_follow_up(client):
    lead = make_lead(client)
    when = datetime.now(UTC) + timedelta(days=2)
    add_note(client, lead["id"], "Booked a call", when)
    body = add_note(client, lead["id"], "Sent brochure meanwhile").json()
    assert datetime.fromisoformat(body["lead"]["follow_up_at"]) == when


def test_note_without_follow_up_clears_a_past_follow_up(db):
    # The follow-up time has passed and the rep logs a note: the follow-up is done.
    now = datetime.now(UTC)
    lead = Lead(name="Asha Rao", follow_up_at=now - timedelta(hours=1))
    db.add(lead)
    db.commit()
    crud.add_discussion(db, lead, DiscussionCreate(note="Called her"), now=now)
    assert lead.follow_up_at is None


def test_new_follow_up_replaces_old_one(client):
    lead = make_lead(client)
    first = datetime.now(UTC) + timedelta(days=1)
    second = datetime.now(UTC) + timedelta(days=5)
    add_note(client, lead["id"], "a", first)
    body = add_note(client, lead["id"], "b", second).json()
    assert datetime.fromisoformat(body["lead"]["follow_up_at"]) == second
