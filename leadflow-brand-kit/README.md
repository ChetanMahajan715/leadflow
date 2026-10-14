# LeadFlow

Every lead, every conversation, every follow-up, on time.

LeadFlow is a single-screen CRM for sales reps and advisors: a list of leads, a timeline of every discussion, and follow-up reminders that surface the right person on the right day. The brand is **calm and trustworthy**. It should feel like a well-kept notebook, not a sales dashboard shouting at you.

## The idea behind the name and mark

A lead *flows* through stages: New → Contacted → Qualified → Proposal Sent → Won (or Lost). The mark is a single rising wave ending in an arrow: steady progress, not a spike. It sits in a rounded teal tile (`radius-lg`, `brand`), so it reads as an app icon at 32px and as a favicon at 16px.

- **Mark**: `leadflow-mark.svg`, for favicon, app icon, header on small screens.
- **Wordmark**: `leadflow-wordmark.svg` on light, `leadflow-wordmark-dark.svg` on dark. "Lead" in `ink`, "Flow" in `brand`.
- **Mono mark**: `leadflow-mark-mono.svg` draws in `currentColor`, for one-colour use (inside buttons, print).
- Give the mark clear space of at least half its height. Never stretch it, recolour the tile, or add effects.

## Voice

Written for a busy rep between calls.

- **Plain and short.** "Follow up today, 2:00 PM", not "You have an upcoming scheduled follow-up reminder".
- **Verbs on buttons.** "Save note", "Add lead", "Set follow-up". Sentence case everywhere except status badges and overlines.
- **Relative time for recency, exact time for commitments.** Last note: "2 hours ago". Follow-up: "Today, 2:00 PM" or "May 6, 2:00 PM".
- **No hype, no emoji in the product UI.** Icons do that job. No exclamation marks except in a lead's own notes.
- **Empty states guide.** "No leads yet. Add your first one to get started." beats "Nothing here".

## Colour

One brand colour, **Flow Teal** (`brand`), on cool neutral surfaces. Teal sits between the blue of finance and the green of growth: trustworthy without being another generic blue SaaS.

- Surfaces stack light to raised: `surface` (page) → `surface-raised` (cards, dialogs) → `surface-sunken` (timeline well).
- Text is `ink` or `ink-muted`, never pure black or grey hex.
- `brand` is for the one primary action per view, the active filter and focus. If everything is teal, nothing is.
- `depth` (deep navy) is a large-surface accent only, for the login panel or marketing. Never body text.
- `danger` means **overdue**. Red is reserved for "you missed this", so it stays meaningful.

### Status colours

Every status has a text token and a `-soft` background token. Badges always pair them (e.g. `status-won` on `status-won-soft`), which keeps 4.5:1 contrast in both themes.

| Status | Token | Why this hue |
| --- | --- | --- |
| New | `status-new` | Blue: fresh, untouched |
| Contacted | `status-contacted` | Amber: in motion, waiting on them |
| Qualified | `status-qualified` | Indigo: confirmed, serious |
| Proposal Sent | `status-proposal` | Plum: the decision stage |
| Won | `status-won` | Green: done, celebrated quietly |
| Lost | `status-lost` | Grey: closed, de-emphasised (the whole card fades to 70%) |

Statuses differ in lightness as well as hue, and the badge always carries the word, so colour is never the only signal.

### Follow-up states

| State | Look |
| --- | --- |
| Today | Card gets `brand-soft` background + `brand` 1px border; pinned to the top. Chip: bell icon, `brand` on `brand-soft`. |
| Overdue | Chip: alert icon, `danger` on `danger-soft`, text "Overdue · May 3, 2:00 PM". Card gets a `danger` 1px border. |
| Upcoming | Chip: calendar icon, `ink-muted` on `surface-sunken`. |

## Typography

**Plus Jakarta Sans** (Google Fonts) for everything: friendly, geometric and very legible at 13–14px. **JetBrains Mono** only for timestamps in the timeline and phone numbers, where aligned digits help.

- `display` 32/38 for login and empty-state headlines.
- `title` 20/28 for dialog titles (the lead's name).
- `heading` 16/24 bold for lead names on cards.
- `body` 14/22 for notes.
- `label` 13/18 semibold for buttons, field labels, filter chips.
- `caption` 12/16 for time-ago and company.
- `overline` 11/16 bold, UPPERCASE, +0.08em tracking for section labels ("TODAY'S FOLLOW-UPS", "ALL LEADS") and status badges.

## Layout and shape

- Content column max 960px, centred; 24px gutter on mobile.
- 4px base grid: `space-1` … `space-12`.
- Corners get rounder as things get bigger: `radius-sm` inputs, `radius-md` cards and buttons, `radius-lg` dialogs, `radius-pill` badges and filter chips.
- Borders before shadows. Cards rest on `line` + `shadow-card`; hover lifts to `shadow-hover` because the whole card is clickable.
- Dialogs: max 640px wide, `shadow-dialog`, backdrop `ink` at 45% with a light blur.

## Iconography

Line icons on a 24px grid, 1.75px stroke, round caps and joins, drawn in `currentColor`. Use them at 16px inline with text and 20px in buttons. Each icon has one job:

`bell` today's follow-up · `alert` overdue · `calendar` scheduled follow-up · `clock` time-ago · `phone` phone number · `building` company · `note` discussion · `pin` pinned section · `plus` add · `search` search · `filter` filters · `close` dismiss.

## Motion

Quick and quiet: 150ms ease-out for hovers, 200ms for dialogs (fade + 8px rise). Respect `prefers-reduced-motion`.

## Accessibility

- Every text token is 4.5:1 on the surfaces its note names, in both themes.
- Focus: 2px `focus-ring` outline with 2px offset on every interactive element.
- Lead cards are buttons (keyboard-openable); dialogs trap focus and close on Esc.
- Required fields show a `danger` asterisk *and* the word "required" for screen readers.
