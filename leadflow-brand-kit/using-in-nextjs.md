# Using LeadFlow in the Next.js app

How to carry this brand kit into the actual assignment code.

## 1. Fonts

In `app/layout.tsx`, load both families with `next/font/google` (`Plus_Jakarta_Sans` weights 400/500/600/700, `JetBrains_Mono` weight 500) and expose them as the CSS variables `--font-sans` and `--font-mono` on `<html>`.

## 2. Colours as CSS variables

Put the colour tokens in `app/globals.css` as variables on `:root`, with the dark values under `@media (prefers-color-scheme: dark)`. Then point Tailwind at them in `tailwind.config.ts` (`colors: { brand: 'var(--brand)', ink: 'var(--ink)', ... }`) so classes like `bg-brand text-on-brand` and `text-status-won bg-status-won-soft` work, and dark mode comes for free.

## 3. One map for statuses

Keep status styling in one place, e.g. `lib/status.ts`:

| API value | Label | Classes |
| --- | --- | --- |
| `new` | New | `text-status-new bg-status-new-soft` |
| `contacted` | Contacted | `text-status-contacted bg-status-contacted-soft` |
| `qualified` | Qualified | `text-status-qualified bg-status-qualified-soft` |
| `proposal_sent` | Proposal Sent | `text-status-proposal bg-status-proposal-soft` |
| `won` | Won | `text-status-won bg-status-won-soft` |
| `lost` | Lost | `text-status-lost bg-status-lost-soft` |

`StatusBadge` and the status dropdown both read this map, so adding a status is a one-line change.

## 4. Logo and favicon

Copy `leadflow-mark.svg` to `app/icon.svg` (Next.js turns it into the favicon automatically) and use `leadflow-wordmark.svg` in the header.

## 5. Component names

Match the components in this system so the code and the brand kit speak the same language: `Button`, `StatusBadge`, `FilterChips`, `FollowUpChip`, `LeadCard`, `Field`, `LeadDialog`.
