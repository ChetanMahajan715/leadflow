import enum
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UTCDateTime, utcnow


class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal_sent = "proposal_sent"
    won = "won"
    lost = "lost"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    company: Mapped[str | None] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(30))
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, native_enum=False, length=20), default=LeadStatus.new
    )
    follow_up_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, default=utcnow, onupdate=utcnow
    )

    # Newest first, so discussions[0] is always the latest note.
    discussions: Mapped[list["Discussion"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by="(Discussion.created_at.desc(), Discussion.id.desc())",
        lazy="selectin",
    )

    @property
    def last_note(self) -> str | None:
        return self.discussions[0].note if self.discussions else None

    @property
    def last_note_at(self) -> datetime | None:
        return self.discussions[0].created_at if self.discussions else None


class Discussion(Base):
    __tablename__ = "discussions"

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), index=True
    )
    note: Mapped[str] = mapped_column(Text)
    follow_up_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    lead: Mapped[Lead] = relationship(back_populates="discussions")
