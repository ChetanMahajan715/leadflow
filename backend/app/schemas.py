"""Pydantic models: what the API accepts (…Create / …Update) and returns (…Out)."""

from datetime import datetime
from typing import Annotated, Any

from pydantic import (
    AwareDatetime,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    StringConstraints,
    field_validator,
)

from app.models import LeadStatus


def _blank_to_none(value: Any) -> Any:
    """Optional text fields: treat "" or "   " as not given."""
    if isinstance(value, str) and not value.strip():
        return None
    return value


Name = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
# The length rule applies to the text only; None (not given) is always allowed.
Company = Annotated[
    Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] | None,
    BeforeValidator(_blank_to_none),
]
Phone = Annotated[
    Annotated[str, StringConstraints(strip_whitespace=True, max_length=30)] | None,
    BeforeValidator(_blank_to_none),
]
Note = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)
]


class LeadCreate(BaseModel):
    name: Name
    company: Company = None
    phone: Phone = None


class LeadUpdate(BaseModel):
    """Every field is optional; only the fields sent are changed."""

    name: Name | None = None
    company: Company = None
    phone: Phone = None
    status: LeadStatus | None = None
    follow_up_at: AwareDatetime | None = None

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
