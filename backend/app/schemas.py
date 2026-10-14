"""Pydantic models: what the API accepts (…Create / …Update) and returns (…Out)."""

from datetime import UTC, datetime
from typing import Annotated, Any

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
)

from app.models import LeadStatus


def _clean_optional_text(value: Any) -> Any:
    """Trim optional text; an empty or blank value means "not given" (None)."""
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


Name = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
Note = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)
]


class LeadCreate(BaseModel):
    name: Name
    company: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=30)

    # mode="before": runs before the length check, so "   " becomes None first.
    clean_optional_text = field_validator("company", "phone", mode="before")(
        _clean_optional_text
    )


class LeadUpdate(BaseModel):
    """Every field is optional; only the fields sent are changed."""

    name: Name | None = None
    company: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=30)
    status: LeadStatus | None = None
    follow_up_at: AwareDatetime | None = None

    clean_optional_text = field_validator("company", "phone", mode="before")(
        _clean_optional_text
    )

    @field_validator("name", "status")
    @classmethod
    def not_null(cls, value):
        # These may be left out, but a lead can never have no name or no status.
        if value is None:
            raise ValueError("cannot be null")
        return value


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    follow_up_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_note: str | None
    last_note_at: datetime | None


class DiscussionCreate(BaseModel):
    note: Note
    follow_up_at: AwareDatetime | None = None

    @field_validator("follow_up_at")
    @classmethod
    def in_the_future(cls, value):
        if value is not None and value <= datetime.now(UTC):
            raise ValueError("Follow-up must be in the future.")
        return value


class DiscussionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    follow_up_at: datetime | None
    created_at: datetime


class DiscussionCreated(BaseModel):
    """Returned after adding a note: the note itself and the lead as it is now,
    so the frontend can update its list without fetching again."""

    discussion: DiscussionOut
    lead: LeadOut
