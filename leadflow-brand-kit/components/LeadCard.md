# LeadCard

One lead in the list: name and company, status badge, the latest note on one line, time since that note, and the follow-up chip when one is set. The whole card is a button that opens the LeadDialog.

- Default: `surface-raised`, `line` border, `shadow-card`, lifting to `shadow-hover`.
- `today`: `brand-soft` fill and `brand` border; these cards are pinned under the "Today's follow-ups" overline.
- `overdue`: `danger` border plus an overdue FollowUpChip.
- `won` / `lost`: the card fades to 72% so active leads stand out.
- The note clamps to one line. A lead with no notes yet shows "No notes yet" in `ink-muted`.
- Time-ago uses `caption` type with the clock icon.
