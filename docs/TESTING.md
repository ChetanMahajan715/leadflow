# LeadFlow test plan

A step-by-step plan to check LeadFlow by hand, from the lowest level up:

| Stage | What it proves | Time |
| --- | --- | --- |
| [Stage 1: Low level](#stage-1-low-level-automated-checks-and-the-api) | The code passes its automated tests and the API answers every request correctly | ~15 min |
| [Stage 2: High level](#stage-2-high-level-every-feature-in-the-browser) | Every feature in the assessment email works in the browser | ~20 min |
| [Stage 3: Rigorous](#stage-3-rigorous-edge-cases-accessibility-and-regression) | Edge cases, accessibility, dark/mobile, Docker and a fresh setup all hold up | ~30 min |

Tick each box as you go. If a step does not give the **Expected** result, note the test ID and what you saw.

Commands are for **Windows PowerShell**, run from the project folder `C:\Users\Chetan\Desktop\LeadFlow` unless a step says otherwise.

---

## Stage 0: Start the app

Use **one** of these two ways. Stages 1 and 2 work with either.

> **Never run Option A and Option B at the same time.** Windows lets both APIs listen on port 8000 (one on IPv4, one on IPv6), so some requests silently go to the other one and the results get mixed up. Before starting, check that nothing is already using the ports:
>
> ```powershell
> Get-NetTCPConnection -LocalPort 8000,3000 -State Listen -ErrorAction SilentlyContinue
> ```
>
> No output means the ports are free. If something is listed, stop it first: Ctrl+C in the terminal running `uvicorn` / `npm run dev`, or `docker compose down`.

### Option A: without Docker (two terminals)

Terminal 1, the API with fresh demo data:

```powershell
cd C:\Users\Chetan\Desktop\LeadFlow\backend
deactivate 2>$null
uv run python seed.py --reset
uv run uvicorn app.main:app --reload --port 8000
```

Terminal 2, the web app:

```powershell
cd C:\Users\Chetan\Desktop\LeadFlow\frontend
npm run dev
```

### Option B: with Docker

```powershell
cd C:\Users\Chetan\Desktop\LeadFlow
docker compose down -v
docker compose up -d --build
```

Then open **http://localhost:3000** (web app) and **http://localhost:8000/docs** (API docs).

> To get the demo data back at any time: Option A, stop the API (Ctrl+C) and run `uv run python seed.py --reset` again. Option B, run `docker compose down -v` then `docker compose up -d`.

---

## Stage 1: Low level (automated checks and the API)

### 1.1 Backend automated tests

Open a **new** terminal (leave the servers running).

```powershell
cd C:\Users\Chetan\Desktop\LeadFlow\backend
deactivate 2>$null
uv run pytest -v
```

- [ ] **T1.1a** Expected: `35 passed`, nothing failed.

```powershell
uv run ruff check .
uv run ruff format --check .
```

- [ ] **T1.1b** Expected: `All checks passed!` and `files already formatted`.

### 1.2 Frontend automated checks

```powershell
cd C:\Users\Chetan\Desktop\LeadFlow\frontend
npm test
```

- [ ] **T1.2a** Expected: `pass 12`, `fail 0`.

```powershell
npm run lint
npx tsc --noEmit
```

- [ ] **T1.2b** Expected: both finish with no errors printed.

```powershell
npm run build
```

- [ ] **T1.2c** Expected: `Compiled successfully` and a route table showing `/`.

### 1.3 API by hand

Paste this helper once into a PowerShell window. It sends a request and prints the **status code** and the **reply**, even for errors:

```powershell
function api($method, $path, $body) {
  try {
    $r = Invoke-WebRequest -Method $method "http://localhost:8000/api$path" -ContentType "application/json" -Body $body -UseBasicParsing
    "$($r.StatusCode) $($r.Content)"
  } catch {
    if (-not $_.Exception.Response) { "NO RESPONSE: is the API running?"; return }
    "$([int]$_.Exception.Response.StatusCode) $($_.ErrorDetails.Message)"
  }
}
```

Now run each line below and compare with **Expected**.

**Health**

```powershell
api GET /health
```

- [ ] **T1.3.1** Expected: `200 {"status":"ok"}`

**List leads**

```powershell
api GET /leads
```

- [ ] **T1.3.2** Expected: `200` and a list of 10 leads. Each has `name`, `status`, `last_note`, `last_note_at`, `follow_up_at`. Times end in `Z` (UTC).

**Filter and search**

```powershell
api GET "/leads?status=won"
api GET "/leads?search=SHA"
api GET "/leads?status=bogus"
```

- [ ] **T1.3.3** Expected: first returns only Daniel Okafor; second returns Vikram Shah (search ignores upper/lower case); third returns `422` with a `detail` message.

**Create a lead**

```powershell
api POST /leads '{"name":"  Test Person  ","company":"Test Co","phone":""}'
```

- [ ] **T1.3.4** Expected: `201`. `name` is `Test Person` (spaces trimmed), `status` is `new`, `phone` is `null`, `last_note` is `Lead created via web form.` Write down the `id` (called **NEW_ID** below).

**Create with bad data**

```powershell
api POST /leads '{"name":"   "}'
api POST /leads '{}'
api POST /leads '{"name":"A","phone":"1234567890123456789012345678901"}'
```

- [ ] **T1.3.5** Expected: all three `422`. The first two mention `name` in `loc`, the third mentions `phone`.

**Get one lead / missing lead**

Replace `NEW_ID` with your id:

```powershell
api GET /leads/NEW_ID
api GET /leads/99999
api GET /leads/99999999999999999999
```

- [ ] **T1.3.6** Expected: `200` with the lead; `404 {"detail":"Lead not found"}`; `422` (id too big), not a crash.

**Update status**

```powershell
api PATCH /leads/NEW_ID '{"status":"qualified"}'
api GET /leads/NEW_ID
api PATCH /leads/NEW_ID '{"status":"nonsense"}'
api PATCH /leads/NEW_ID '{"name":null}'
api PATCH /leads/99999 '{"status":"won"}'
```

- [ ] **T1.3.7** Expected: `200` with `"status":"qualified"`; the GET shows `qualified` again (saved); `422`; `422` (name cannot be emptied); `404`.

**Timeline and notes**

```powershell
api POST /leads/NEW_ID/discussions '{"note":"First call"}'
api POST /leads/NEW_ID/discussions '{"note":"Second call"}'
api GET /leads/NEW_ID/discussions
```

- [ ] **T1.3.8** Expected: both POSTs `201` and each reply contains `discussion` **and** `lead`. The GET lists `Second call`, `First call`, `Lead created via web form.` in that order (newest first).

**Note with a follow-up**

```powershell
$tomorrow = (Get-Date).AddDays(1).ToUniversalTime().ToString("o")
api POST /leads/NEW_ID/discussions "{`"note`":`"Call back tomorrow`",`"follow_up_at`":`"$tomorrow`"}"
```

- [ ] **T1.3.9** Expected: `201`; in the reply, `lead.follow_up_at` is tomorrow's date (in UTC).

**Follow-up in the past is refused**

```powershell
$yesterday = (Get-Date).AddDays(-1).ToUniversalTime().ToString("o")
api POST /leads/NEW_ID/discussions "{`"note`":`"Too late`",`"follow_up_at`":`"$yesterday`"}"
api POST /leads/NEW_ID/discussions '{"note":"   "}'
api POST /leads/99999/discussions '{"note":"x"}'
```

- [ ] **T1.3.10** Expected: `422` with `Follow-up must be in the future.`; `422` (empty note); `404`.

**Delete**

```powershell
api DELETE /leads/NEW_ID
api GET /leads/NEW_ID
api DELETE /leads/NEW_ID
```

- [ ] **T1.3.11** Expected: `204` with empty reply; `404`; `404`.

**Search treats % and _ as normal characters**

```powershell
api GET "/leads?search=_"
```

- [ ] **T1.3.12** Expected: `200 []` (no lead has `_` in its name). Before a fix this returned every lead.

**API docs page**

- [ ] **T1.3.13** Open http://localhost:8000/docs. Expected: 8 endpoints, each with a short description. Click **GET /api/leads** > **Try it out** > **Execute**: you get `200` and the list.

### 1.4 Seed script (Option A only)

Stop the API first (Ctrl+C in terminal 1), then:

```powershell
cd C:\Users\Chetan\Desktop\LeadFlow\backend
uv run python seed.py
```

- [ ] **T1.4a** Expected: `The database already has leads. Run with --reset to replace them.` (it refuses, so data is never duplicated).

```powershell
uv run python seed.py --reset
uv run python seed.py --reset
```

- [ ] **T1.4b** Expected: `Seeded 10 leads.` both times, and `api GET /leads` (after restarting the API) shows exactly 10, not 20.

Start the API again for Stage 2:

```powershell
uv run uvicorn app.main:app --reload --port 8000
```

---

## Stage 2: High level (every feature in the browser)

Start with fresh demo data (see Stage 0) and open **http://localhost:3000**.

### 2.1 Lead list (email: "name, status badge, last note, time ago")

- [ ] **T2.1** Look at any card. Expected: name in bold, company in grey, a coloured status badge top right, `Last note: ...` on one line, a clock icon with `2 days ago` style time.
- [ ] **T2.2** Expected: 10 cards in total. Won (Daniel Okafor) and Lost (Kavita Desai) cards look faded.

### 2.2 Today's follow-ups pinned (email: "pinned at the top")

- [ ] **T2.3** Expected: a **TODAY'S FOLLOW-UPS** section at the top with a pin icon, containing Priya Menon and Rahul Khanna, teal background, bell chip `Follow up today, <time>`, earliest time first.
- [ ] **T2.4** Expected: these two do **not** appear again under **ALL LEADS**.

### 2.3 Overdue in red (bonus)

- [ ] **T2.5** Expected: at the top of **ALL LEADS**, Vikram Shah then Ananya Iyer with a **red border** and a red chip `Overdue · <date, time>` (most overdue first).
- [ ] **T2.6** Expected: upcoming follow-ups (Rohan Gupta, Sarah Thompson, Arjun Rao) show a grey calendar chip with date and time. No other card is red.

### 2.4 Filters (email + bonus)

- [ ] **T2.7** Expected counts on the chips: All 10, New 2, Contacted 2, Qualified 2, Proposal sent 2, Won 1, Lost 1.
- [ ] **T2.8** Click **Qualified**. Expected: only Ananya Iyer and Sarah Thompson, the chip turns teal. Click **All** to go back.
- [ ] **T2.9** Click **Contacted**. Expected: Rahul Khanna stays inside the Today section (filters apply to both sections) and Arjun Rao is under All leads.

### 2.5 Search (bonus)

- [ ] **T2.10** Type `an` slowly in the search box. Expected: about a quarter second after you stop typing, only names containing "an" remain (Rahul Khanna, Ananya Iyer, Rohan Gupta, Daniel Okafor), and the chip counts change to match.
- [ ] **T2.11** Type `zzz`. Expected: `No leads match your search or filter.` and a **Clear search and filter** button. Click it: all 10 leads come back.
- [ ] **T2.12** Type `SHA` in capitals. Expected: Vikram Shah is found.

### 2.6 Lead timeline dialog (email: "dialog, not a new page", "reverse chronological")

- [ ] **T2.13** Click **Priya Menon**. Expected: a dialog opens over the dimmed list; the address bar still shows `localhost:3000/` (no new page).
- [ ] **T2.14** Expected in the dialog head: name, company, phone in a monospace font, a status dropdown showing `Proposal sent`, and an X button.
- [ ] **T2.15** Expected in the timeline: 3 notes, **newest at the top**, each with an exact time and relative time (e.g. `Oct 13, 3:00 PM · 2 days ago`). The top dot is teal. The note that set a follow-up shows a `Follow-up set for ...` chip.
- [ ] **T2.16** Close it three ways, reopening in between: the **X**, the **Esc** key, and clicking the dark area outside. Expected: closes every time.

### 2.7 Adding a note updates the list immediately (email: the key flow)

- [ ] **T2.17** Open **Meera Kapoor** (she is under All leads and has no follow-up). Type `Called her, demo booked`. Tick **Set follow-up**. Expected: the date and time boxes become active and show today's date and the next whole hour.

  > **After 11 PM** the suggestion is midnight, which is tomorrow. For T2.19, change the time to one later today (e.g. `23:50`) before saving, or run this part before 11 PM.
- [ ] **T2.18** Click **Save note**. Expected: the button briefly says `Saving…`, then your note appears at the top of the timeline with a `Follow-up set for ...` chip, and the text box empties.
- [ ] **T2.19** Close the dialog. Expected (follow-up later today): **Meera Kapoor is now in TODAY'S FOLLOW-UPS** with `Last note: Called her, demo booked` and `just now`, **without refreshing the page**.

### 2.8 Status update persists (email)

- [ ] **T2.20** Open **Arjun Rao**, change the dropdown to **Qualified**. Expected: it saves immediately (no save button), and after closing, his card badge says QUALIFIED and the Qualified chip count goes up by 1.
- [ ] **T2.21** Press **F5** to reload the page. Expected: Arjun Rao is still **Qualified**.

### 2.9 Add new lead (email)

- [ ] **T2.22** Click **Add lead** (top right). Expected: a dialog with Full name (red `*`), Company `(optional)`, Phone `(optional)`; the cursor is already in Full name.
- [ ] **T2.23** Click **Save lead** with everything empty. Expected: red border and `Name is required.` under Full name; dialog stays open.
- [ ] **T2.24** Type only spaces in Full name, save. Expected: still `Name is required.`
- [ ] **T2.25** Enter `Neha Joshi`, company `Joshi Wealth Advisory`, phone `+91 98765 43210`, click **Save lead**. Expected: dialog closes, Neha Joshi appears in the list at once with a **NEW** badge and `Last note: Lead created via web form.`, `just now`; All count goes up by 1.
- [ ] **T2.26** Click **Add lead**, type something, click **Cancel**. Expected: dialog closes, nothing is added.
- [ ] **T2.27** Press F5. Expected: Neha Joshi is still there (saved in the database).

---

## Stage 3: Rigorous (edge cases, accessibility and regression)

### 3.1 Follow-up rules (the core logic)

- [ ] **T3.1 Overdue clears when you log a note.** Open **Vikram Shah** (red, overdue). Type `Called him, done`, do **not** tick Set follow-up, Save. Close. Expected: Vikram is **no longer red** and has no follow-up chip (logging a note after a missed follow-up means it was done).
- [ ] **T3.2 A future follow-up is kept.** Open **Sarah Thompson** (follow-up in 2 days). Log a note without a follow-up. Expected: her calendar chip is unchanged.
- [ ] **T3.3 A new follow-up replaces the old one.** Open **Rohan Gupta** (follow-up tomorrow). Tick Set follow-up, pick a date next week, Save. Expected: his chip shows the new date.
- [ ] **T3.4 Past time refused in the form.** Open any lead, tick Set follow-up, set the time to one hour ago today, Save. Expected: `Pick a time in the future.` under the inputs, nothing saved.
- [ ] **T3.5 Won/Lost are never overdue.** Open **Ananya Iyer** (overdue), change status to **Won**, close. Expected: her red border and red chip disappear (and she fades). Change her back to Qualified: she is red again.
- [ ] **T3.6 Missed earlier today stays in Today, in red.** Make Rahul Khanna's follow-up 10 minutes ago with this command (needs the `api` helper from 1.3; replace `RAHUL_ID` with his id from `api GET "/leads?search=rahul"`):

  ```powershell
  $past = (Get-Date).AddMinutes(-10).ToUniversalTime().ToString("o")
  api PATCH /leads/RAHUL_ID "{`"follow_up_at`":`"$past`"}"
  ```

  Reload the page. Expected: Rahul stays in **TODAY'S FOLLOW-UPS** but with a **red** border and `Overdue · ...` chip.

### 3.2 Empty, loading and error states

- [ ] **T3.7 API down.** Stop the API (Ctrl+C, or `docker compose stop backend`). Reload the page. Expected: `Can't reach the server. Check that the API is running.` with a **Try again** button (grey, not red). Start the API again, click **Try again**: the list loads.
- [ ] **T3.8 Empty database (Option A).** Stop the API, then:

  ```powershell
  cd C:\Users\Chetan\Desktop\LeadFlow\backend
  $env:DATABASE_URL = "sqlite:///./empty-test.db"
  uv run uvicorn app.main:app --port 8000
  ```

  Reload. Expected: `No leads yet. Add your first one to get started.` Add one lead: the message is replaced by the card. Afterwards stop the API, then run `Remove-Item Env:DATABASE_URL; Remove-Item empty-test.db` and start the normal API again.
- [ ] **T3.9 Loading state.** Press F5 and watch closely. Expected: grey placeholder boxes flash briefly before the cards appear.

### 3.3 Keyboard only (accessibility)

Put the mouse aside.

- [ ] **T3.10** Press **Tab** repeatedly from the top. Expected: a visible teal outline moves through Add lead, search, each filter chip, then each lead card.
- [ ] **T3.11** With a card outlined, press **Enter**. Expected: its dialog opens and the focus is inside it.
- [ ] **T3.12** Keep pressing **Tab** inside the dialog. Expected: focus cycles inside the dialog and never goes to the list behind it.
- [ ] **T3.13** Press **Esc**. Expected: dialog closes and the outline is back on the **same card**.
- [ ] **T3.14** Tab to **Add lead**, press Enter, press Enter again on Save lead with no name. Expected: the error appears and focus moves to the Full name box.
- [ ] **T3.15** Tab to a filter chip and press **Space**. Expected: the filter applies.

### 3.4 Tricky input

- [ ] **T3.16 Drag-select does not close the dialog.** In a dialog, type a long note, then press the mouse inside the text box and drag out onto the dark background before releasing. Expected: dialog stays open and your text is still there.
- [ ] **T3.17 Long note.** Paste a very long note (several lines) and save. Expected: the timeline shows it in full with line breaks; the card shows it cut to one line with `...`.
- [ ] **T3.18 Special characters.** Add a lead named `O'Brien & Sons <test> 😀` with company `Ünïcødé Ltd`. Expected: shown exactly as typed (no broken text, no HTML effects).
- [ ] **T3.19 Double click.** Type a note and double-click **Save note** quickly. Expected: the note appears **once** (button is disabled while saving).
- [ ] **T3.20 Search with spaces.** Type `  meera  ` (with spaces). Expected: Meera Kapoor is found.

### 3.5 Looks: dark mode, mobile, time

- [ ] **T3.21 Dark mode.** Windows Settings > Personalization > Colors > **Dark**. Expected: the app switches to dark colours by itself (no reload needed or after F5); text stays readable; overdue still red. Switch back afterwards.
- [ ] **T3.22 Mobile.** Press **F12**, then the phone icon (Ctrl+Shift+M), choose a phone like iPhone 12 (390 px). Expected: filter chips wrap onto extra lines, no sideways scrolling, cards and dialogs fit the screen, dialog content scrolls inside.
- [ ] **T3.23 Time keeps moving.** Leave the page open for 2 minutes after adding a note. Expected: `just now` changes to `1 minute ago` or `2 minutes ago` without reloading (the page refreshes times once a minute).
- [ ] **T3.24 Timezone (optional).** Windows Settings > Time & language > Date & time > turn off automatic time zone, pick a different one (e.g. London), reload. Expected: all times shift to the new zone and the follow-up sections recalculate. Set it back to India afterwards.

### 3.6 Docker (full stack with PostgreSQL)

- [ ] **T3.25 Clean start.**

  ```powershell
  cd C:\Users\Chetan\Desktop\LeadFlow
  docker compose down -v
  docker compose up -d --build
  docker compose ps
  ```

  Expected: `db` shows `(healthy)`, `backend` and `frontend` are `running`. http://localhost:3000 shows 10 leads.
- [ ] **T3.26 Data lives in Postgres.**

  ```powershell
  docker compose exec db psql -U leadflow -d leadflow -c "select name, status from leads;"
  ```

  Expected: the 10 lead names listed by Postgres.
- [ ] **T3.27 Survives a restart.** Add a lead in the browser, then:

  ```powershell
  docker compose restart
  ```

  Reload the page. Expected: your lead is still there and there are not 20 demo leads (seed runs only once).
- [ ] **T3.28 Wiped on purpose.**

  ```powershell
  docker compose down -v
  docker compose up -d
  ```

  Expected: back to exactly the 10 demo leads.

### 3.7 Fresh setup from the README (regression)

This proves someone else can run the project.

- [ ] **T3.29** Clone the repo into an empty folder and follow README section 4, Option B, word for word:

  ```powershell
  cd $env:TEMP
  Remove-Item -Recurse -Force leadflow-fresh -ErrorAction SilentlyContinue
  git clone C:\Users\Chetan\Desktop\LeadFlow leadflow-fresh
  cd leadflow-fresh
  ```

  Expected: every README command works without changes, and the app shows 10 leads. (Stop your other servers first so ports 8000 and 3000 are free.)

### 3.8 After pushing to GitHub

- [ ] **T3.30** On GitHub, open the repo's **Actions** tab. Expected: the **CI** run has three green jobs: `backend`, `frontend`, `docker-compose`.
- [ ] **T3.31** Open the repo page. Expected: the README shows the screenshots and all links work.

---

## Summary sheet

| Stage | Tests | Passed | Notes |
| --- | --- | --- | --- |
| 1. Low level | T1.1 to T1.4 |  |  |
| 2. High level | T2.1 to T2.27 |  |  |
| 3. Rigorous | T3.1 to T3.31 |  |  |

When everything passes: stop the servers (Ctrl+C, or `docker compose down`), reset the demo data, record the video, and push.
