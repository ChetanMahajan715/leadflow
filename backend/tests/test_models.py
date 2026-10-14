from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.exc import StatementError

from app.models import Discussion, Lead, LeadStatus


def test_lead_defaults_and_utc_round_trip(db):
    ist = timezone(timedelta(hours=5, minutes=30))
    follow_up = datetime(2026, 10, 15, 14, 0, tzinfo=ist)
    lead = Lead(name="Asha Rao", follow_up_at=follow_up)
    db.add(lead)
    db.commit()
    db.expire_all()  # force a real read from the database

    lead = db.get(Lead, lead.id)
    assert lead.status == LeadStatus.new
    assert lead.created_at.tzinfo is not None
    assert lead.follow_up_at == follow_up  # same instant
    assert lead.follow_up_at.utcoffset() == timedelta(0)  # returned as UTC


def test_naive_datetime_rejected(db):
    db.add(Lead(name="X", follow_up_at=datetime(2026, 1, 1, 9, 0)))
    with pytest.raises(StatementError, match="timezone-aware"):
        db.commit()


def test_deleting_lead_deletes_discussions(db):
    lead = Lead(name="Asha Rao", discussions=[Discussion(note="Hi")])
    db.add(lead)
    db.commit()
    db.delete(lead)
    db.commit()
    assert db.query(Discussion).count() == 0
