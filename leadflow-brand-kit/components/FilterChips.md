# FilterChips

Single-select filter for the lead list: All plus one chip per status. The selected chip fills with `brand`; the rest are outlined with `line-strong`.

- Pill chips, 32px tall, `label` type, with a count of matching leads.
- Exactly one chip is pressed (`aria-pressed="true"`). All is the default.
- Filtering never hides Today's follow-ups that match; it applies to both sections.
- Wrap to a second line on narrow screens rather than scrolling sideways.
