# Button

The action trigger. One `primary` per view (Add lead in the header, Save note / Save lead in a dialog); everything else is `secondary` or `ghost`.

- Variants: `primary` (brand fill, on-brand label), `secondary` (raised surface, line-strong border), `ghost` (no fill, ink-muted), plus `icon` for square icon-only buttons.
- Height 36px, `radius-md`, `label` type. Icons 16px, `space-2` before the label.
- Labels are verbs in sentence case: "Save note", not "Submit".
- Icon-only buttons need an `aria-label`. While saving, disable the button and swap the label to "Saving…".
