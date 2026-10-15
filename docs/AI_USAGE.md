# AI usage log

LeadFlow was built with Claude Code (model: Claude Opus 5.5) as a pair programmer. This file records, phase by phase, what the AI generated, what I (Chetan) reviewed or changed, and any mistakes the AI made and how they were fixed.

## Phase 1: Plan

**AI generated**
- Read the assessment brief (my master prompt to the AI), the brand kit and the wireframes; asked me clarifying questions.
- A design spec and a step-by-step implementation plan (my private working documents, not published).
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

## Phase 9: Add lead dialog + frontend code review

**AI generated**
- `components/Field.tsx`, `components/AddLeadDialog.tsx`, the header "Add lead" button, `data-autofocus` support in `Dialog`.

**Verified in the browser**
- Opening puts focus in Full name. Empty save: "Name is required.", red border, `aria-invalid`, dialog stays open; blank spaces are rejected too.
- Saving "Neha Joshi / Joshi Wealth Advisory": dialog closes, focus returns to "Add lead", the lead is in the list at once (after the overdue leads, as designed), All count 10 -> 11, and it is still there after a reload.
- Cancel closes without saving. With an empty database the page shows "No leads yet. Add your first one to get started." and the first lead replaces it.

**Code review (separate reviewer agent, verdict "with fixes", no critical issues)**
Fixed:
- A text selection started inside a dialog and released over the backdrop closed the dialog and lost the draft. Backdrop now closes on `mousedown`. Verified with real mouse events.
- Follow-up errors were not linked to their inputs, and an empty name did not move focus, so screen readers said nothing. Fixed; added a hidden `<h1>`.
- A won/lost lead whose follow-up passed earlier today was pinned in Today's section with no chip. Now excluded (test written first).
- A note saved before the timeline finished loading could be overwritten; "Save note" is disabled until it loads.
- Two different ways of closing a dialog from a button; now one helper, `closeParentDialog`.
- Focus is lost if the lead's card is filtered out after closing; falls back to the search box.
- "required" was announced twice; status-save error shown in neutral colours (red is for overdue and field errors).
- Simplified the chip counts (no type cast) and the chip text.

Declined, with reason:
- Delete the three icons not used yet: the brief asks for all 12 kit icons as components.
- Remove `ApiError.status`: it carries meaning (0 = server unreachable).
- Tailwind wiring in `next.config.ts` differs from one docs page: it is exactly what `create-next-app` 16.4 generated, and `next build` works.

## Phase 10: Docker Compose (and a Windows problem)

**AI generated**
- `backend/Dockerfile`, `frontend/Dockerfile`, both `.dockerignore`, `docker-compose.yml`, root `.env.example`, and `.github/workflows/ci.yml` (tests, lint, build and a Compose smoke test on every push). Checked the current Docker Compose docs (Context7) and the Next.js self-hosting docs first; checked that `package-lock.json` contains the Linux builds of Next.js / Tailwind native packages so `npm ci` works in the container.
- Validated with `docker compose config` (resolved values checked: Postgres URL, healthcheck dependency, volume, build argument).

**What happened with Docker on my laptop**
- With my approval the AI installed WSL 2 and Docker Desktop 4.95 system-wide (an agreed exception to my "nothing global" rule; nothing project-related is global).
- Docker's engine never started: "Virtual Machine Platform not enabled / No virtualization available", although BIOS virtualization was on and the hypervisor was running.
- Diagnosis steps (systematic, read-only first): Docker backend log, `wsl --status`, Windows feature states, the missing `vmcompute` service, `CBS.log`, `dism /checkhealth` ("The component store is repairable"). Root cause: the Virtual Machine Platform component is a Feature on Demand on Windows 11 26H2 and Windows Update returned 0 bytes for it, so enabling it looped forever at 14.6%.
- Tried: re-enabling features with DISM, `bcdedit /set hypervisorlaunchtype auto`, `wsl --update`, turning the feature off and on, `DISM /RestoreHealth`, and a Windows in-place repair. None could download the component.
- AI mistakes during this: it first said the machine was on a Windows Insider build (it is not; corrected after checking the registry); its first "engine ready" check was wrong because `docker info` returns success even when the engine answers 500 (fixed by checking `docker version` for a server version); a repair script started DISM in a hidden window, which the AI then had to stop itself.
- Result: Docker could not run on this machine. The Compose setup is validated locally and is exercised end to end by the CI workflow on GitHub. The README says this plainly.

## Phase 11: Docs and delivery

**AI generated**
- `README.md` (all 12 sections from the brief), a demo script, 13 screenshots in `docs/screenshots/` (light, dark, mobile, every flow) taken from the running app with headless Edge.

**Found and fixed while verifying**
- Screenshots first showed "Can't reach the server": the terminal had the tools environment (`LeadFlow/.venv`) activated, so `uv run` used it instead of `backend/.venv`. Fixed by deactivating; the README now warns about this.
- Fresh-clone test (clone into an empty folder, follow the README word for word) found that `tsc` failed before the first build because `LayoutProps` is generated by Next.js. Fixed by typing `children` explicitly; this would also have failed CI.

**Verified (final run)**
- Backend: 35 tests pass, ruff clean, formatting clean. Frontend: 12 tests pass, `tsc` clean, lint clean, production build succeeds. `docker compose config` valid.
- Fresh clone following the README: seed creates 10 leads, API and `/docs` respond, the browser shows 10 cards in both sections.

## Phase 10, completed: Docker running

- The next day Windows had updated itself to build 26300.9711. On that build the same `dism /enable-feature /featurename:VirtualMachinePlatform` (run by me in an admin PowerShell) reached 100% and completed: Windows Update now had the component. After a restart, `vmcompute` existed, WSL ran the `docker-desktop` distro and Docker's engine (29.8.2) came up.
- Clean-state test: `docker compose down -v` then `docker compose up -d --build` (about 4.5 minutes for the first build). Order confirmed: `db` healthy, then `backend`, then `frontend`.
- Verified: `/api/health` ok, `/docs` 200, web 200; Postgres holds 10 leads and 30 discussions (checked with `psql` inside the `db` container); the web app renders the seeded list with correct IST times (with `TZ=Asia/Kolkata` in my local `.env`); a lead added through the API is still there after `docker compose restart`, and the seed did not run twice.
- The README note saying Docker could not run on my machine was replaced with these results.

## Final cleanup before publishing

- Ran the full manual test plan (docs/TESTING.md) against the Docker setup: every check passed. It surfaced two time-of-day issues, both fixed: the demo's two "later today" follow-ups tied at 11:59 PM late in the evening (seed now caps them at 11:30 PM and 11:59 PM, with a test), and test-plan wording for checks run after 11 PM. It also showed that running the local setup and Docker at the same time sends requests to two different APIs; the test plan now warns about this.
- Kept only what the submission needs in the public repo. My personal working documents (the prompt I gave the AI, the plan, the design spec, study notes, the demo script and the brief's wireframes) stay on my machine and were removed from the git history before the first push, with commit messages reworded to match what each commit contains. The final code is unchanged.
- Rewrote the README for GitHub: logo, badges, screenshots, Mermaid diagrams, setup, API and test sections.
