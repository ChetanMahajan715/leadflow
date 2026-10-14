// Time helpers. The API sends UTC; everything here works in the browser's own
// timezone, because `new Date(iso)` and the Intl formatters use it automatically.
// No imports except types, so `node --test` can run the tests directly.

import type { Lead } from "./types.ts";

export type FollowUpState = "today" | "overdue" | "upcoming";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "always" });

/** "just now", "5 minutes ago", "2 hours ago", "3 days ago", "1 week ago"... */
export function timeAgo(iso: string, now = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (ms < MINUTE) return "just now";
  if (ms < HOUR) return relative.format(-Math.floor(ms / MINUTE), "minute");
  if (ms < DAY) return relative.format(-Math.floor(ms / HOUR), "hour");
  if (ms < 7 * DAY) return relative.format(-Math.floor(ms / DAY), "day");
  if (ms < 30 * DAY) return relative.format(-Math.floor(ms / (7 * DAY)), "week");
  if (ms < 365 * DAY) return relative.format(-Math.floor(ms / (30 * DAY)), "month");
  return relative.format(-Math.floor(ms / (365 * DAY)), "year");
}

/** "May 6, 2:00 PM" (adds the year when it is not this year). */
export function formatDateTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "2:00 PM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function isSameLocalDay(iso: string, now = new Date()): boolean {
  return new Date(iso).toDateString() === now.toDateString();
}

/**
 * - overdue:  the follow-up time has passed (the backend clears it when a newer
 *             note is logged, so "passed" means "missed"). Never for won/lost.
 * - today:    later today.
 * - upcoming: another day in the future.
 */
export function followUpState(
  lead: Pick<Lead, "follow_up_at" | "status">,
  now = new Date(),
): FollowUpState | null {
  if (!lead.follow_up_at) return null;
  if (new Date(lead.follow_up_at) <= now) {
    const closed = lead.status === "won" || lead.status === "lost";
    return closed ? null : "overdue";
  }
  return isSameLocalDay(lead.follow_up_at, now) ? "today" : "upcoming";
}

/**
 * Splits the list into the two sections on screen:
 * - today:  follow-up on today's date (even if the time has passed), earliest first
 * - others: everyone else, overdue first (most overdue at the top), then most recently active
 */
export function splitLeads(leads: Lead[], now = new Date()): { today: Lead[]; others: Lead[] } {
  const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);
  const isOverdue = (l: Lead) => followUpState(l, now) === "overdue";

  const today = leads
    .filter((l) => l.follow_up_at && isSameLocalDay(l.follow_up_at, now))
    .sort((a, b) => time(a.follow_up_at) - time(b.follow_up_at));

  const others = leads
    .filter((l) => !today.includes(l))
    .sort((a, b) => {
      if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1;
      if (isOverdue(a)) return time(a.follow_up_at) - time(b.follow_up_at);
      return time(b.last_note_at ?? b.updated_at) - time(a.last_note_at ?? a.updated_at);
    });

  return { today, others };
}

/** The date ("2026-10-15") and time ("14:30") inputs are local; the API wants UTC. */
export function localInputsToIso(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

/** Starting values for the follow-up date/time inputs: the next whole hour, local time. */
export function defaultFollowUpInputs(now = new Date()): { date: string; time: string } {
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`,
    time: `${pad(next.getHours())}:00`,
  };
}
