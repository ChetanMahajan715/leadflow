# AI usage log

LeadFlow was built with Claude Code (model: Claude Opus 5.5) as a pair programmer. This file records, phase by phase, what the AI generated, what I (Chetan) reviewed or changed, and any mistakes the AI made and how they were fixed.

## Phase 1: Plan

**AI generated**
- Read the assessment brief (`MASTER_PROMPT.md`), the brand kit and the wireframes; asked me clarifying questions.
- Design spec: `docs/superpowers/specs/2026-10-14-leadflow-design.md`.
- Implementation plan: `docs/PLAN.md`.
- `.gitignore`, `.gitattributes`, git repo setup.
- A Graphify knowledge graph of the brand kit (`graphify-out/`, not committed).

**I decided**
- Install Docker Desktop myself so Docker Compose can be tested for real.
- Let the AI pick overdue placement: overdue leads go at the top of "All leads" (the wireframes only show two sections).
- Tools such as Graphify run from a project-local uv environment (`LeadFlow/.venv`), never a global install.

**AI mistakes and fixes**
- The AI first ran Graphify from a copy that was installed globally on my machine. I pointed out my "project-local uv only" rule; it stopped, created `LeadFlow/.venv` with uv and installed Graphify there.
- Running the Graphify CLI from the new environment silently replaced my global Graphify skill file with a newer packaged version. The AI noticed the message, showed me the difference and restored my original file from the backup.
- Graphify's extraction flagged two inconsistencies in the brand kit: Lost cards fade to 70% (README) vs 72% (LeadCard spec), and red used for required/error fields although the README reserves red for overdue. Decision: follow the more specific component specs (72%, red asterisk and field errors as the Field spec says).

## Phase 2: Backend foundation

**AI generated**
- `backend/.venv` (uv, Python 3.12), `requirements.txt` pinned to the versions uv resolved on 2026-10-14, `.env.example`.
- `app/config.py`, `app/database.py`, `app/models.py`, `app/main.py`, and tests in `tests/` (written first, seen failing, then made to pass).
- Checked current FastAPI and SQLAlchemy docs through Context7 before writing code.

**Changed after review**
- The plan stored datetimes with `DateTime(timezone=True)`; the SQLAlchemy docs recommend storing naive UTC and re-attaching UTC on read, which behaves identically on SQLite and Postgres. Switched to the docs recipe.
- Ruff flagged `timezone.utc` (use `datetime.UTC`) and a test catching a blind `Exception`; the test now expects the exact `StatementError` with the message "timezone-aware".

**Known, accepted**
- pytest prints a deprecation warning from Starlette suggesting `httpx2` instead of `httpx` for `TestClient`. The master brief names `httpx`, it works, and the warning does not affect results.
