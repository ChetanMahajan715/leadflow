# FollowUpChip

Shows a lead's next follow-up, on the card and under the timeline entry that set it. Three states, computed from the follow-up time against now:

- `today`: bell icon, `brand` on `brand-soft`. "Follow up today, 2:00 PM".
- `overdue` (time is in the past and no newer note was logged): alert icon, `danger` on `danger-soft`. "Overdue · May 3, 11:00 AM".
- `upcoming`: calendar icon, `ink-muted` on `surface-sunken`. "May 9, 10:30 AM".

26px tall, `radius-sm`, 12px semibold. Commitments always show the exact time, never "in 3 hours".
