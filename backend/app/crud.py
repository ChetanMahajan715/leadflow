"""All database reads and writes. Routes call these; they never build queries themselves."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Discussion, Lead, LeadStatus
from app.schemas import LeadCreate, LeadUpdate

FIRST_NOTE = "Lead created via web form."


def list_leads(
    db: Session, status: LeadStatus | None = None, search: str | None = None
) -> list[Lead]:
    query = select(Lead).order_by(Lead.updated_at.desc(), Lead.id.desc())
    if status is not None:
        query = query.where(Lead.status == status)
    if search and search.strip():
        query = query.where(Lead.name.ilike(f"%{search.strip()}%"))
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
