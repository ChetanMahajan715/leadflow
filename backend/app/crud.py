"""All database reads and writes. Routes call these; they never build queries themselves."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import utcnow
from app.models import Discussion, Lead, LeadStatus
from app.schemas import DiscussionCreate, LeadCreate, LeadUpdate

FIRST_NOTE = "Lead created via web form."


def list_leads(
    db: Session, status: LeadStatus | None = None, search: str | None = None
) -> list[Lead]:
    query = select(Lead).order_by(Lead.updated_at.desc(), Lead.id.desc())
    if status is not None:
        query = query.where(Lead.status == status)
    if search and search.strip():
        # autoescape: a typed % or _ is matched literally, not as a wildcard
        query = query.where(Lead.name.icontains(search.strip(), autoescape=True))
    return list(db.scalars(query))


def get_lead(db: Session, lead_id: int) -> Lead | None:
    return db.get(Lead, lead_id)


def create_lead(db: Session, data: LeadCreate) -> Lead:
    # Every lead starts with one note so its timeline is never empty.
    lead = Lead(**data.model_dump(), discussions=[Discussion(note=FIRST_NOTE)])
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def update_lead(db: Session, lead: Lead, data: LeadUpdate) -> Lead:
    # exclude_unset: only touch fields the client actually sent.
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead


def delete_lead(db: Session, lead: Lead) -> None:
    db.delete(lead)
    db.commit()


def add_discussion(
    db: Session, lead: Lead, data: DiscussionCreate, now: datetime | None = None
) -> Discussion:
    """Saves a note and applies the follow-up rule:

    - note WITH a follow-up: the lead's follow-up becomes that time.
    - note WITHOUT one: a follow-up whose time has already passed is cleared,
      because logging a note after it means the rep did follow up. A future
      follow-up is kept.

    So a lead is overdue exactly when its follow-up time is in the past.
    """
    now = now or utcnow()
    discussion = Discussion(
        lead=lead, note=data.note, follow_up_at=data.follow_up_at, created_at=now
    )
    if data.follow_up_at is not None:
        lead.follow_up_at = data.follow_up_at
    elif lead.follow_up_at is not None and lead.follow_up_at <= now:
        lead.follow_up_at = None
    lead.updated_at = now
    db.add(discussion)
    db.commit()
    db.refresh(lead)
    return discussion
