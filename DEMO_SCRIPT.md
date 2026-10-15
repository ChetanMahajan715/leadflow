# Demo script (about 2 minutes)

**Before recording:** start the backend with fresh demo data (`uv run python seed.py --reset`, then `uv run uvicorn app.main:app --port 8000`) and the frontend (`npm run dev`). Open http://localhost:3000 in a normal browser window, light mode, about 1280 px wide.

| Time | Do | Say |
| --- | --- | --- |
| 0:00 | Show the page | "LeadFlow is a one-screen lead manager. Each card shows the name, status badge, last note and how long ago it was logged." |
| 0:15 | Point at the top section, then the red cards | "Today's follow-ups are pinned at the top, earliest first. Overdue follow-ups are in red at the top of All leads." |
| 0:25 | Click **Qualified**, then **All** | "Filters by status, with counts." |
| 0:32 | Type `sha` in the search box, then clear it | "Search by name, as you type." |
| 0:40 | Click **Priya Menon** | "Clicking a lead opens its timeline in a dialog, not a new page, newest note first, with exact and relative times." |
| 0:50 | Close (Esc), open **Meera Kapoor** (in All leads) | "Meera has no follow-up yet." |
| 0:55 | Type a note, tick **Set follow-up** (keeps today's date, next hour), click **Save note** | "I log the call and set a follow-up for later today." |
| 1:05 | Point at the timeline, close the dialog | "The note is on top, and in the list Meera has already moved into Today's follow-ups, with no page reload." |
| 1:15 | Open **Arjun Rao**, change status to **Qualified**, close, refresh the page (F5) | "Status saves as soon as I change it, and it is still Qualified after a refresh." |
| 1:30 | Click **Add lead**, click **Save lead** with an empty name | "Name is required." |
| 1:35 | Type a name and company, **Save lead** | "The new lead appears in the list straight away with status New." |
| 1:45 | Switch the computer to dark mode (or show the dark screenshot) | "Light and dark mode come from the brand tokens." |
| 1:50 | Open http://localhost:8000/docs | "The FastAPI backend documents every endpoint; tests cover each status code and the follow-up rules." |
| 2:00 | End | |
