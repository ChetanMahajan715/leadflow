"""Demo data for LeadFlow.

    uv run python seed.py          # seed an empty database
    uv run python seed.py --reset  # delete all leads and notes, then seed again

Every time is relative to "now", so the demo always has a follow-up later
today, overdue ones and upcoming ones. "Today" uses this machine's timezone.
"""

import argparse
import sys
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.crud import FIRST_NOTE
from app.database import Base, SessionLocal, engine
from app.models import Discussion, Lead, LeadStatus


def later_today(now: datetime, hours: int) -> datetime:
    """`hours` from now, but never past 23:59 today (so it stays "today")."""
    end_of_day = now.replace(hour=23, minute=59, second=0, microsecond=0)
    when = min(now + timedelta(hours=hours), end_of_day)
    return when if when > now else now + timedelta(minutes=1)


def build_leads(now: datetime) -> list[Lead]:
    def ago(days=0, hours=0):
        return now - timedelta(days=days, hours=hours)

    today_soon = later_today(now, 2)
    today_evening = later_today(now, 5)
    overdue_1d = ago(days=1)
    overdue_3d = ago(days=3)
    tomorrow = now + timedelta(days=1)
    in_2_days = now + timedelta(days=2)
    in_6_days = now + timedelta(days=6)

    # One row per lead: name, company, phone, status, current follow-up,
    # then its notes oldest first as (when, text, follow-up set by that note).
    # fmt: off
    data = [
        ("Priya Menon", "Menon Family Office", "+91 98201 44521", LeadStatus.proposal_sent, today_soon, [
            (ago(days=8), FIRST_NOTE, None),
            (ago(days=6), "Discovery call. Family office, wants quarterly rebalancing reports for three generations of accounts.", None),
            (ago(days=2), "Sent the advisory plan proposal. She will review it with her brother and call back.", today_soon),
        ]),
        ("Rahul Khanna", "Khanna Capital Advisors", "+91 99300 12877", LeadStatus.contacted, today_evening, [
            (ago(days=3), FIRST_NOTE, None),
            (ago(days=1), "Left a voicemail. His assistant said he is travelling until tonight.", None),
            (ago(hours=3), "Quick chat between meetings. Asked me to call back this evening.", today_evening),
        ]),
        ("Ananya Iyer", "Northstar Wealth Partners", "+91 98450 66012", LeadStatus.qualified, overdue_1d, [
            (ago(days=10), FIRST_NOTE, None),
            (ago(days=5), "Demo went well. Team of 12 advisors, all using spreadsheets today.", None),
            (ago(days=3), "Asked for pricing for 15 seats. Promised to send numbers and follow up.", overdue_1d),
        ]),
        ("Vikram Shah", "Shah & Sons Investments", "+91 97690 30455", LeadStatus.new, overdue_3d, [
            (ago(days=6), FIRST_NOTE, None),
            (ago(days=5), "Inbound from the website. Wants a call about onboarding his two partners.", overdue_3d),
        ]),
        ("Sarah Thompson", "Brightpath Financial Planning", "+44 20 7946 0321", LeadStatus.qualified, in_2_days, [
            (ago(days=14), FIRST_NOTE, None),
            (ago(days=9), "Intro call. UK planning firm, interested in follow-up reminders for annual reviews.", None),
            (ago(days=4), "Needs a compliance review before signing. Their officer is back next week.", None),
            (ago(days=1), "Compliance call booked. Prepare the data-handling summary.", in_2_days),
        ]),
        ("Arjun Rao", "Rao Insurance Brokers", "+91 90040 77213", LeadStatus.contacted, in_6_days, [
            (ago(days=4), FIRST_NOTE, None),
            (ago(days=2), "Emailed the product overview. He is busy with renewals this week.", in_6_days),
        ]),
        ("Meera Kapoor", "Kapoor Tax & Advisory", None, LeadStatus.new, None, [
            (ago(hours=2), FIRST_NOTE, None),
            (ago(hours=1), "Filled the contact form asking about client reporting for tax season.", None),
        ]),
        ("Rohan Gupta", None, "+91 98111 50490", LeadStatus.proposal_sent, tomorrow, [
            (ago(days=12), FIRST_NOTE, None),
            (ago(days=7), "Independent advisor with about 80 clients. Wants a simple tool, no long setup.", None),
            (ago(days=1), "Sent the solo-advisor proposal. Decision expected tomorrow.", tomorrow),
        ]),
        ("Daniel Okafor", "Harbourview Advisors", "+1 415 555 0142", LeadStatus.won, None, [
            (ago(days=30), FIRST_NOTE, None),
            (ago(days=25), "First call. 6-person advisory team moving off a legacy CRM.", None),
            (ago(days=18), "Proposal sent with migration support included.", None),
            (ago(days=10), "Negotiated a 12-month term. Legal is reviewing.", None),
            (ago(days=3), "Contract signed! Onboarding starts Monday.", None),
        ]),
        ("Kavita Desai", "Desai Retirement Planners", "+91 98923 81604", LeadStatus.lost, None, [
            (ago(days=20), FIRST_NOTE, None),
            (ago(days=12), "Sent proposal for 5 seats.", None),
            (ago(days=4), "They chose to build an in-house tool. Worth checking in again next year.", None),
        ]),
    ]
    # fmt: on

    leads = []
    for name, company, phone, status, follow_up_at, notes in data:
        leads.append(
            Lead(
                name=name,
                company=company,
                phone=phone,
                status=status,
                follow_up_at=follow_up_at,
                created_at=notes[0][0],
                updated_at=notes[-1][0],
                discussions=[
                    Discussion(note=text, created_at=at, follow_up_at=fu)
                    for at, text, fu in notes
                ],
            )
        )
    return leads


def seed(db: Session, now: datetime | None = None) -> int:
    """Adds the demo leads and returns how many were added."""
    leads = build_leads(now or datetime.now().astimezone())
    db.add_all(leads)
    db.commit()
    return len(leads)


def clear(db: Session) -> None:
    db.execute(delete(Discussion))
    db.execute(delete(Lead))
    db.commit()


def seed_if_empty(db: Session) -> bool:
    """Seeds only when there are no leads yet. Used on startup in Docker."""
    if db.scalars(select(Lead.id).limit(1)).first() is not None:
        return False
    seed(db)
    return True


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Fill the LeadFlow database with demo data."
    )
    parser.add_argument(
        "--reset", action="store_true", help="delete all leads and notes first"
    )
    args = parser.parse_args(argv)

    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if args.reset:
            clear(db)
        elif db.query(Lead).count() > 0:
            print("The database already has leads. Run with --reset to replace them.")
            return 1
        print(f"Seeded {seed(db)} leads.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
