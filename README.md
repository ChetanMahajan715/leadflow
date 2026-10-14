# LeadFlow

**Every lead, every conversation, every follow-up, on time.**

LeadFlow is a single-screen lead manager for a sales rep or advisor. It lists every lead with its status, latest note and how long ago it was logged; pins **today's follow-ups** at the top; highlights **overdue** ones in red; and opens each lead in a **timeline dialog** where the rep logs a discussion, sets the next follow-up and changes the status. Built for the PravarAI AI-smart full-stack intern assessment.

![Lead list with today's follow-ups pinned and overdue leads in red](docs/screenshots/02-todays-followups-and-overdue.png)

| Timeline dialog | Adding a note with a follow-up | List updates at once |
| --- | --- | --- |
| ![Lead dialog](docs/screenshots/05-lead-dialog-timeline.png) | ![Note with follow-up](docs/screenshots/06-note-with-follow-up-before.png) | ![List updated](docs/screenshots/08-list-updated-immediately.png) |

| Add lead validation | Dark mode | Mobile |
| --- | --- | --- |
| ![Add lead](docs/screenshots/10-add-lead-validation.png) | ![Dark mode](docs/screenshots/11-dark-mode.png) | ![Mobile](docs/screenshots/13-mobile.png) |

All screenshots: [`docs/screenshots/`](docs/screenshots/). Demo video: _link to be added_. Demo script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

## 1. Features

**Required**
- [x] Lead list: name, status badge, last discussion note, time since last discussion
- [x] Filter by status (New / Contacted / Qualified / Proposal sent / Won / Lost), with counts
- [x] Today's follow-ups pinned at the top, earliest first
- [x] Click a lead to open a dialog (not a new page) with the full discussion history, newest first
- [x] Form to add a note with an optional follow-up date and time
- [x] Saving a note with a follow-up updates the lead's follow-up and the list immediately (no reload)
- [x] Status can be changed from the dialog and persists
- [x] Add a new lead: name required, company and phone optional, status defaults to New

**Bonus**
- [x] Search leads by name (as you type)
- [x] Overdue follow-ups highlighted in red
- [x] Docker Compose setup (Postgres, API, web) - see the note in [Setup](#4-setup)
- [x] Seed script with 10 leads and 2-5 discussions each
- [x] Filters
- [x] Light and dark mode, responsive down to phone width, keyboard accessible dialogs
- [x] CI on GitHub Actions: tests, lint, type check, build and a Docker Compose smoke test
- [ ] Login (optional; not built)

## 2. Tech stack and why

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript | The stack PravarAI prefers; TypeScript catches mistakes in API data shapes early |
| Styling | Tailwind CSS 4 + the LeadFlow brand tokens | Brand colours, spacing and dark mode come from one set of CSS variables |
| Backend | FastAPI (Python 3.12) | Preferred stack; request validation and `/docs` come for free |
| Data | SQLAlchemy 2 + Pydantic v2 | Typed models; Pydantic gives clear 422 messages per field |
| Database | SQLite locally, PostgreSQL in Docker | Zero setup for development; a real server database in Compose. Only `DATABASE_URL` changes |
| Tests | pytest (backend), Node's built-in test runner (frontend rules) | No extra test frameworks needed |
| Tooling | uv (Python env), npm, ruff, ESLint | uv keeps every Python package inside `backend/.venv` |

No state-management or UI component libraries: React state plus one small API client, and the browser's native `<dialog>`.

## 3. Requirements

Python 3.11+ (uv can install it for you), [uv](https://docs.astral.sh/uv/), Node.js 20.9+ with npm, Git. Docker + Docker Compose only for option A. Exact Python versions: [`backend/requirements.txt`](backend/requirements.txt); frontend: [`frontend/package.json`](frontend/package.json).

## 4. Setup

### Option A: Docker Compose

```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
docker compose up --build
```

Open http://localhost:3000 (web) and http://localhost:8000/docs (API). The first start seeds 10 demo leads into Postgres (`SEED_ON_STARTUP=true`); data is kept in the `pgdata` volume. `docker compose down -v` deletes it.

> **Honest note:** the Compose file is validated with `docker compose config`, and the GitHub Actions workflow builds the three images, starts them and checks the API, the seeded data and the web page on every push. It could not be run on my own laptop: Docker Desktop's engine needs the Windows "Virtual Machine Platform" component, which Windows Update failed to install on that machine (details in [`docs/AI_USAGE.md`](docs/AI_USAGE.md)).

### Option B: run it manually

**Backend** (terminal 1):

```bash
cd backend
uv venv .venv --python 3.12
uv pip install -r requirements.txt
cp .env.example .env               # Windows: Copy-Item .env.example .env
uv run python seed.py              # 10 demo leads (add --reset to start over)
uv run uvicorn app.main:app --reload --port 8000
```

API on http://localhost:8000, interactive docs on http://localhost:8000/docs.

> If another Python virtual environment is active in your terminal, run `deactivate` first: `uv run` prefers an active environment over `backend/.venv`.

**Frontend** (terminal 2):

```bash
cd frontend
npm ci
cp .env.example .env.local         # Windows: Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## 5. Environment variables

| Variable | Used by | Example | Meaning |
| --- | --- | --- | --- |
| `DATABASE_URL` | backend | `sqlite:///./leadflow.db` | SQLAlchemy URL. Compose builds a Postgres URL from the `POSTGRES_*` values |
| `CORS_ORIGINS` | backend | `http://localhost:3000` | Comma-separated origins allowed to call the API |
| `SEED_ON_STARTUP` | backend | `true` | Seed demo data when the API starts and the database is empty |
| `TZ` | backend (Compose) | `Asia/Kolkata` | Timezone the seed script uses for "today"; the UI always uses the browser's timezone |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:8000` | API address as the browser sees it; baked in at build time |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Compose `db` | `leadflow` / `change-me` / `leadflow` | Postgres credentials and database name |

All are listed with comments in [`.env.example`](.env.example) (plus `backend/.env.example` and `frontend/.env.example` for the manual setup). Real `.env` files are git-ignored.

## 6. API

Interactive docs with descriptions for every endpoint: **http://localhost:8000/docs**.

| Method | Path | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Health check | 200 | |
| GET | `/api/leads?status=&search=` | List leads (each with `last_note`, `last_note_at`, `follow_up_at`); optional status filter and case-insensitive name search | 200 | 422 unknown status |
| POST | `/api/leads` | Create a lead (name required, status `new`, first note "Lead created via web form.") | 201 | 422 |
| GET | `/api/leads/{id}` | One lead | 200 | 404, 422 bad id |
| PATCH | `/api/leads/{id}` | Update status or other fields (only the fields sent change) | 200 | 404, 422 |
| DELETE | `/api/leads/{id}` | Delete a lead and its notes | 204 | 404 |
| GET | `/api/leads/{id}/discussions` | Timeline, newest first | 200 | 404 |
| POST | `/api/leads/{id}/discussions` | Add a note with optional future `follow_up_at`; returns `{discussion, lead}` | 201 | 404, 422 |

Errors always use one shape: `{"detail": "Lead not found"}`, or for validation a list of `{loc, msg}` per field. Unexpected errors return `{"detail": "Internal server error"}` (500); the real error is only logged.

## 7. Project structure

```
backend/
  app/
    main.py          app, CORS, error handling, startup (tables + optional seed)
    config.py        settings from environment / .env
    database.py      engine, session, UTC datetime type
    models.py        Lead, Discussion
    schemas.py       request/response models and validation
    crud.py          database operations and the follow-up rule
    routers/leads.py all /api/leads endpoints
  seed.py            demo data (CLI: --reset)
  tests/             pytest: endpoints, follow-up rule, seed, errors
frontend/
  app/               layout.tsx (fonts), page.tsx (the one screen), globals.css (brand tokens), icon.svg
  components/        Header, SearchBar, FilterChips, LeadList, LeadCard, StatusBadge, FollowUpChip,
                     Dialog, LeadDialog, Timeline, NoteForm, AddLeadDialog, Field, Button, Logo, icons
  lib/               api.ts, types.ts, status.ts, time.ts (+ time.test.ts)
docs/                PLAN.md, LEARNING_NOTES.md, AI_USAGE.md, DEMO_SCRIPT.md, screenshots/
leadflow-brand-kit/  the brand kit the UI follows
docker-compose.yml, .env.example, .github/workflows/ci.yml
```

## 8. Design decisions

**Follow-up rule.** Saving a note *with* a follow-up sets the lead's follow-up. Saving a note *without* one clears the lead's follow-up if its time has already passed (logging the note means the rep followed up) and keeps a future one. So a lead is **overdue** exactly when its follow-up time is in the past. A follow-up in the past is rejected when logging a note. Won and Lost leads are never overdue.

**Sections.** "Today's follow-ups" holds leads whose follow-up falls on today's date in the browser's timezone, earliest first; one whose time has already passed stays there in red. "All leads" shows overdue leads first (most overdue on top), then the most recently active. Overdue leads stay in "All leads" rather than a third section, because the wireframes and brand kit define only these two sections.

**Timezones.** Everything is stored and sent in UTC. The browser converts to the user's local time (`Intl` / `Date`), nothing is hard-coded to India. The date and time inputs are read as local time and converted to UTC before sending.

**"Updates immediately".** Adding a note returns `{discussion, lead}`. The page swaps that lead into its React state, re-renders, and the card moves between sections without a reload or a second request. The dialog reads the lead from the same state, so they never disagree.

**Search.** Done in the browser, 250 ms after typing stops: all leads are already loaded for the filter counts, so it is instant and the counts match. The API also supports `?search=` and `?status=` (tested).

**SQLite locally, Postgres in Docker.** SQLite needs no setup for development and tests; Postgres is the realistic server database. Timestamps use a small SQLAlchemy type that stores UTC and returns timezone-aware values, so both behave the same.

**Dialogs.** The browser's native `<dialog>` with `showModal()` gives focus trapping, Esc to close and the backdrop without a library. Focus returns to the lead's card on close.

## 9. Running tests

```bash
cd backend
uv run pytest            # 35 tests: every endpoint, status codes, validation, follow-up rule, seed
uv run ruff check .

cd ../frontend
npm test                 # 12 tests: today / overdue / upcoming rules, sorting, time formatting
npm run lint
npx tsc --noEmit
```

## 10. How AI was used

Built with Claude Code (Claude Opus 5.5) as a pair programmer, following a written plan ([`docs/PLAN.md`](docs/PLAN.md)) phase by phase: tests first for the backend, a check of current library docs before writing code, a review by a separate reviewer agent after the backend and after the frontend, and in-browser checks of every flow. Every phase, what the AI generated, what I decided or changed, and every mistake it made and how it was fixed are logged in [`docs/AI_USAGE.md`](docs/AI_USAGE.md). [`docs/LEARNING_NOTES.md`](docs/LEARNING_NOTES.md) explains each concept and where it is in the code.

## 11. Known limitations and ideas

- No login (optional in the brief). Next step: email/password with a seeded demo user and JWT.
- The list loads every lead and its notes at once; fine for a rep's few hundred leads, would need pagination and a "latest note" query beyond that.
- Tables are created on startup; a growing schema would need migrations (Alembic).
- The seed's "today" uses the server's timezone (`TZ` in Docker).
- Ideas that fit PravarAI: an **AI summary** of a lead's discussion history, a **suggested next action** and follow-up time from the latest notes, and a daily digest of today's and overdue follow-ups.

## 12. Credit

The visual design follows the LeadFlow brand kit in [`leadflow-brand-kit/`](leadflow-brand-kit/) (colours, typography, icons, component rules). The wireframes in the assessment brief were used as layout reference.
