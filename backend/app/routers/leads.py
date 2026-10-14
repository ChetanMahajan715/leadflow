from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Response
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.models import Lead, LeadStatus
from app.schemas import (
    DiscussionCreate,
    DiscussionCreated,
    DiscussionOut,
    LeadCreate,
    LeadOut,
    LeadUpdate,
)

router = APIRouter(prefix="/api/leads", tags=["leads"])

# "Give this route a database session."
DB = Annotated[Session, Depends(get_db)]


# Ids are positive and must fit the database's 64-bit integer, else 422.
LeadId = Annotated[int, Path(ge=1, le=2**63 - 1)]


def get_lead_or_404(lead_id: LeadId, db: DB) -> Lead:
    """Loads the lead named in the URL, or stops the request with 404."""
    lead = crud.get_lead(db, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


# "Give this route the lead from the URL (404 if it does not exist)."
LeadFromUrl = Annotated[Lead, Depends(get_lead_or_404)]

NOT_FOUND = {404: {"description": "Lead not found"}}


@router.get("", response_model=list[LeadOut], summary="List leads")
def list_leads(db: DB, status: LeadStatus | None = None, search: str | None = None):
    """All leads, most recently active first. Each lead includes its latest note.

    - `status`: only leads with this status (422 if it is not a valid status)
    - `search`: case-insensitive match anywhere in the name
    """
    return crud.list_leads(db, status, search)


@router.post("", response_model=LeadOut, status_code=201, summary="Create a lead")
def create_lead(data: LeadCreate, db: DB):
    """Name is required; company and phone are optional. Status starts as `new`,
    and a first note "Lead created via web form." is added to the timeline."""
    return crud.create_lead(db, data)


@router.get(
    "/{lead_id}", response_model=LeadOut, responses=NOT_FOUND, summary="Get one lead"
)
def get_lead(lead: LeadFromUrl):
    """One lead by id."""
    return lead


@router.patch(
    "/{lead_id}", response_model=LeadOut, responses=NOT_FOUND, summary="Update a lead"
)
def update_lead(data: LeadUpdate, lead: LeadFromUrl, db: DB):
    """Change any of name, company, phone, status, follow_up_at. Fields left out
    stay as they are. Send `"follow_up_at": null` to clear a follow-up.

    Unlike logging a note, this accepts a past `follow_up_at`: it edits the
    record as-is (useful for corrections and demo data)."""
    return crud.update_lead(db, lead, data)


@router.delete(
    "/{lead_id}",
    status_code=204,
    response_class=Response,
    responses=NOT_FOUND,
    summary="Delete a lead",
)
def delete_lead(lead: LeadFromUrl, db: DB):
    """Deletes the lead and all its discussions."""
    crud.delete_lead(db, lead)


@router.get(
    "/{lead_id}/discussions",
    response_model=list[DiscussionOut],
    responses=NOT_FOUND,
    summary="Lead timeline",
)
def list_discussions(lead: LeadFromUrl):
    """Every note logged for this lead, newest first."""
    return lead.discussions


@router.post(
    "/{lead_id}/discussions",
    response_model=DiscussionCreated,
    status_code=201,
    responses=NOT_FOUND,
    summary="Log a discussion",
)
def add_discussion(data: DiscussionCreate, lead: LeadFromUrl, db: DB):
    """Adds a note, with an optional follow-up (must be a future time with a timezone).

    Follow-up rule: a note **with** `follow_up_at` sets the lead's follow-up to it.
    A note **without** one clears the lead's follow-up if that time has already
    passed (logging the note means the follow-up happened), otherwise keeps it.

    Returns the new discussion **and the updated lead**, so the list can update
    immediately.
    """
    discussion = crud.add_discussion(db, lead, data)
    return {"discussion": discussion, "lead": lead}
