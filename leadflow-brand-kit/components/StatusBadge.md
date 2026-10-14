# StatusBadge

Shows where a lead is in the pipeline, top-right of every lead card. Each of the six statuses has its own colour pair: `status-<name>` text on `status-<name>-soft`.

- Pill (`radius-pill`), 22px tall, `overline` type (11px, bold, uppercase, +0.08em).
- Always shows the word, so colour is never the only signal.
- Read-only. The status is changed with the select in the lead dialog, never by clicking the badge.
