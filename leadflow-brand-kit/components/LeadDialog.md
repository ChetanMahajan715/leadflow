# LeadDialog

The lead's timeline, opened by clicking a LeadCard. It is a dialog over the dimmed list, never a new page.

- Head: name (`title`), company in `ink-muted`, phone in mono, the status select (saves on change) and a close button.
- Body (`surface-sunken`): discussions newest first. The latest dot is `brand`, older ones `line-strong`. A note that set a follow-up shows a FollowUpChip under it.
- Foot: note textarea, "Set follow-up" checkbox that enables the date and time inputs, and the primary "Save note" button.
- After saving, clear the form, add the note to the top of the timeline and update the lead in the list straight away, without a page reload.
- Max 640px wide, `radius-lg`, `shadow-dialog`; scroll the body, not the page. Esc and the backdrop close it; focus returns to the card that opened it.
