# Field

A labelled input for the Add lead form and the note composer. Label above, input, then optional help or error text.

- Label in `label` type. Required fields get a `danger` asterisk; optional ones say "(optional)" in `ink-muted`.
- Input: 40px, `radius-sm`, `line-strong` border, placeholder in `ink-muted`. Textareas start at 72px and resize vertically.
- Error: `danger` border and a one-sentence message below ("Name is required."), shown after the first submit attempt, not while typing.
- Mirror the API: if the backend returns 422, show its message under the matching field.
