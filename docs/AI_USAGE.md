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

## Phase 3: Lead API

**AI generated**
- `app/schemas.py`, `app/crud.py`, `app/routers/leads.py`, tests `tests/test_leads.py` and `tests/test_errors.py` (tests first, seen failing, then implemented).

**AI mistakes and fixes**
- First version of the optional `company` / `phone` types put the length limit on `str | None` as a whole, so Pydantic tried to measure the length of `None` and crashed. The test `test_create_lead_trims_and_blanks_become_null` caught it; the limit now applies only to the `str` part.
- First router used `= Depends(...)` defaults; ruff (B008) flagged them. Rewritten in the `Annotated[..., Depends(...)]` style that current FastAPI docs recommend.
- Using `status` as both a query parameter name and the imported `fastapi.status` module was confusing, so the routes use the plain numbers 201 and 204.

**Added beyond the plan**
- A test that `PATCH {"name": null}` returns 422 (it would otherwise crash with 500).
- A test that an unexpected crash returns `{"detail": "Internal server error"}` and leaks nothing.

## Phase 4: Discussions API + code review

**AI generated**
- Discussion schemas, `crud.add_discussion` with the follow-up rule, the two discussion routes, `tests/test_discussions.py` (tests first).
- Added beyond the plan: a follow-up in the past is rejected with 422 when logging a note.

**Code review (separate reviewer agent, verdict "with fixes", no critical issues)**
Fixed, each with a failing test first:
- 500 responses had no CORS headers (Starlette's catch-all handler runs outside the CORS middleware), so the browser would show a CORS error instead of the message. Replaced with an error-catching middleware placed inside CORS.
- Search treated `%` and `_` as wildcards (`?search=_` matched everyone). Now uses `icontains(..., autoescape=True)`.
- A lead id larger than 64 bits crashed with 500; now 422.
- The test client ran app startup against the real database URL; it no longer does.
- A weak list assertion (`!= []`) now checks the order. That stronger test was then flaky on Windows: two writes in the same clock tick tie on `updated_at`. The test now sets the time explicitly. The app itself was correct (ties fall back to id).
- The optional company/phone types were hard to explain (nested `Annotated`); replaced with plain `Field(max_length=...)` plus one "trim, blank means None" validator.

Declined, with reason:
- Remove the `not_null` validator in `LeadUpdate` by loosening type hints: kept, explicit is easier to explain.
- `seed_on_startup` unused: it is used in Phase 5.

## Phase 5: Seed script

**AI generated**
- `backend/seed.py` (10 leads, 30 notes, every status, today/overdue/upcoming/none follow-ups), `tests/test_seed.py` (tests first), `SEED_ON_STARTUP` wiring in `app/main.py`.
- Verified by hand: the CLI seeds 10 leads, refuses a second run, `--reset` twice still leaves 10 leads and 30 notes; with `SEED_ON_STARTUP=true` two server restarts still give 10 leads.

**Changed after review**
- The AI's first `main()` had tangled if/elif/else returns; simplified to: reset or refuse, then seed.
- `ruff format` expanded the data table to almost 300 lines; wrapped it in `# fmt: off` / `# fmt: on` to keep one readable row per lead.

**Known limitation**
- "Today" in the seed uses the server machine's timezone. Locally that is my timezone; in Docker the container's `TZ` decides it (set in Phase 10).

## Phase 6: Frontend foundation

**AI generated**
- Scaffolded with `create-next-app` (Next.js 16.4, React 19.3, Tailwind 4, ESLint). Removed the template's placeholder files (Vercel logos, favicon.ico, template README).
- `app/globals.css` (brand tokens + Tailwind mapping), `app/layout.tsx` (fonts), `app/icon.svg` (kit favicon), `components/icons.tsx` (12 kit icons), `components/Logo.tsx`, `lib/types.ts`, `lib/status.ts`, `lib/time.ts` + tests, `lib/api.ts`, `frontend/.env.example`.
- Read the current Next.js and Tailwind docs (Context7 and the docs bundled with Next.js 16) before writing code.

**Decisions and fixes**
- Header logo drawn inline instead of using the wordmark SVG as an image: an SVG in `<img>` cannot use the page's web font, and inline colours follow light/dark tokens.
- The scaffold's `.gitignore` ignored every `.env*` file including `.env.example`; added an exception.
- `npm test` first pointed Node at a folder; changed to a glob.
- TypeScript rejected `./time.ts` imports (needed by Node's test runner); enabled `allowImportingTsExtensions` (safe because Next.js never emits JS from tsc).
- `ApiError` first used TypeScript "parameter properties", which Node's type-stripping cannot run; rewritten with plain fields (also easier to read).
- `npm install` held back one install script (`unrs-resolver`, used by ESLint's import resolver). Lint works without it, so it stays blocked.

**Verified**
- `npm test` 10/10 (also under UTC-7 and UTC+13), `tsc --noEmit` clean, `npm run lint` clean, `npm run build` succeeds.
- `api.ts` run against the live backend: list (10 leads), 422 mapped to `name` / `follow_up_at`, 404 message, note saved with updated lead, and "Can't reach the server" with the API stopped.

## Phase 7: Lead list

**AI generated**
- `components/` Button, StatusBadge, FollowUpChip, LeadCard, FilterChips, SearchBar, LeadList, Header; `app/page.tsx` with loading, empty, no-results and error states.

**Problems found and fixed**
- `Button` first combined a base `border-transparent` with a variant `border-line-strong`; with Tailwind the winner depends on CSS order, not class order. Each variant now sets its own border.
- `next build` failed: Next.js 16 refuses `new Date()` while pre-building a Client Component. `now` now starts as `null` and is set in the browser.
- ESLint's `react-hooks/set-state-in-effect` flagged the first fetching code. Rewritten with React's documented pattern: fetch inside the effect with `.then`, an `ignore` flag, and a `reloads` counter for "Try again".
- Brand voice: filter chips use sentence case ("Proposal sent"); the badge stays uppercase.
- The API-down banner uses neutral colours, not red, because the brand reserves red for overdue.

**Verified in a real browser** (headless Microsoft Edge, already on Windows, driven over its DevTools protocol by a small script; nothing installed)
- Light, dark and 375px phone width screenshots match the brand kit previews; chips wrap, notes clamp to one line.
- Today's follow-ups pinned and sorted; overdue leads first in All leads with red border and chip; upcoming chips; won/lost faded.
- Filter "Qualified" shows exactly the 2 qualified leads; search "an" (after the 250 ms debounce) shows the 4 matching names and chip counts update; "zzz" shows the no-results state and "Clear search and filter" restores all 10.
- API stopped: banner "Can't reach the server..."; API restarted + "Try again": banner gone, 10 cards.

## Phase 8: Lead dialog

**AI generated**
- `components/Dialog.tsx` (native `<dialog>`), `LeadDialog.tsx`, `Timeline.tsx`, `NoteForm.tsx`; `defaultFollowUpInputs` in `lib/time.ts` (test first); dialog animation and `color-scheme` in `globals.css`; page wiring (`openId`, `updateLead`, `closeDialog`).

**Verified in the browser** (headless Edge over DevTools protocol)
- Opening a card shows the timeline newest first; focus moves into the dialog; Tab stays inside it.
- Keyboard: focus a card, Enter opens, Esc closes and focus returns to the card.
- Empty note: "Write a note first." Ticking "Set follow-up" suggests the next hour today.
- Saving a note with a follow-up today: note on top of the timeline, form cleared, and the lead appears in "Today's follow-ups" without a reload.
- Status changed to Qualified from the dialog; after reloading the page the badge still says Qualified.
- Backdrop click and the X button close the dialog. Light and dark screenshots match the brand kit.

**AI mistakes and fixes**
- Focus did not return to the card after closing. Cause found by testing: when a note moves the lead to the other section, React draws a new card, so the browser's built-in "return focus" points at a card that no longer exists. Fix: the page focuses the card by `data-lead-id` when the dialog closes.
- The AI's test helper sent Enter without the key's text, so the first keyboard test failed for a test-tool reason, not an app bug; fixed the helper and re-ran.
- The first commit of the dialog included `LeadDialog.tsx`, which imports `NoteForm` from the following commit, so `tsc` failed at that commit (the app still built). With my approval the 4 unpushed commits were replayed with the note form first; the final code is identical and every commit now passes `tsc` and lint.
