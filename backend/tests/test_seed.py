from datetime import datetime

from app.models import Discussion, Lead, LeadStatus
from seed import clear, seed, seed_if_empty


def test_seed_covers_every_status_and_follow_up_state(db):
    now = datetime.now().astimezone()  # aware, in this machine's timezone
    count = seed(db, now)
    leads = db.query(Lead).all()

    assert count == len(leads) >= 8
    assert {lead.status for lead in leads} == set(LeadStatus)
    assert all(2 <= len(lead.discussions) <= 5 for lead in leads)

    follow_ups = [lead.follow_up_at for lead in leads if lead.follow_up_at]
    local_today = now.date()
    assert any(
        f > now and f.astimezone(now.tzinfo).date() == local_today for f in follow_ups
    )
    assert any(f < now for f in follow_ups)  # overdue
    assert any(
        f.astimezone(now.tzinfo).date() > local_today for f in follow_ups
    )  # upcoming
    assert any(lead.follow_up_at is None for lead in leads)


def test_overdue_leads_have_no_note_after_their_follow_up(db):
    now = datetime.now().astimezone()
    seed(db, now)
    for lead in db.query(Lead).all():
        if lead.follow_up_at and lead.follow_up_at < now:
            assert lead.last_note_at < lead.follow_up_at


def test_no_note_is_in_the_future(db):
    now = datetime.now().astimezone()
    seed(db, now)
    assert all(d.created_at <= now for d in db.query(Discussion).all())


def test_clear_then_seed_does_not_duplicate(db):
    first = seed(db)
    clear(db)
    assert db.query(Discussion).count() == 0
    assert seed(db) == first
    assert db.query(Lead).count() == first


def test_seed_if_empty_only_seeds_an_empty_database(db):
    assert seed_if_empty(db) is True
    count = db.query(Lead).count()
    assert seed_if_empty(db) is False
    assert db.query(Lead).count() == count
