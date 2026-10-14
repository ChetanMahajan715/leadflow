// Run with: npm test   (Node's built-in test runner, no extra libraries)
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Lead, LeadStatus } from "./types.ts";
import { defaultFollowUpInputs, followUpState, localInputsToIso, splitLeads, timeAgo } from "./time.ts";

// All dates are built in the machine's local time, like the browser does.
const now = new Date(2026, 9, 14, 12, 0); // 14 Oct 2026, 12:00 local
const at = (hour: number, dayOffset = 0) => new Date(2026, 9, 14 + dayOffset, hour, 0).toISOString();

function lead(id: number, follow_up_at: string | null, extra: Partial<Lead> = {}): Lead {
  return {
    id,
    name: `Lead ${id}`,
    company: null,
    phone: null,
    status: "new",
    follow_up_at,
    created_at: at(8, -10),
    updated_at: at(8, -10),
    last_note: null,
    last_note_at: null,
    ...extra,
  };
}

test("follow-up later today is 'today'", () => {
  assert.equal(followUpState(lead(1, at(15)), now), "today");
});

test("follow-up earlier today has passed, so it is 'overdue'", () => {
  assert.equal(followUpState(lead(1, at(9)), now), "overdue");
});

test("follow-up yesterday is 'overdue'", () => {
  assert.equal(followUpState(lead(1, at(15, -1)), now), "overdue");
});

test("follow-up tomorrow is 'upcoming'", () => {
  assert.equal(followUpState(lead(1, at(9, 1)), now), "upcoming");
});

test("no follow-up gives null", () => {
  assert.equal(followUpState(lead(1, null), now), null);
});

test("won and lost leads are never overdue", () => {
  for (const status of ["won", "lost"] as LeadStatus[]) {
    assert.equal(followUpState(lead(1, at(9, -1), { status }), now), null);
    assert.equal(followUpState(lead(1, at(15), { status }), now), "today");
  }
});

test("splitLeads pins today's follow-ups sorted by time", () => {
  const { today } = splitLeads([lead(1, at(16)), lead(2, at(9)), lead(3, at(13)), lead(4, null)], now);
  assert.deepEqual(
    today.map((l) => l.id),
    [2, 3, 1],
  );
});

test("splitLeads puts overdue first in the rest, then most recently active", () => {
  const leads = [
    lead(1, null, { last_note_at: at(11) }),
    lead(2, at(9, -2), { last_note_at: at(8, -3) }), // overdue
    lead(3, at(9, 3), { last_note_at: at(10, -1) }), // upcoming
    lead(4, at(9, -1), { last_note_at: at(8, -4), status: "won" }), // past, but won: not overdue
    lead(5, at(15)), // today: pinned, not in the rest
  ];
  const { today, others } = splitLeads(leads, now);
  assert.deepEqual(
    today.map((l) => l.id),
    [5],
  );
  assert.deepEqual(
    others.map((l) => l.id),
    [2, 1, 3, 4],
  );
});

test("timeAgo", () => {
  const before = (ms: number) => new Date(now.getTime() - ms).toISOString();
  assert.equal(timeAgo(before(30_000), now), "just now");
  assert.equal(timeAgo(before(5 * 60_000), now), "5 minutes ago");
  assert.equal(timeAgo(before(2 * 3_600_000), now), "2 hours ago");
  assert.equal(timeAgo(before(3 * 86_400_000), now), "3 days ago");
  assert.equal(timeAgo(before(8 * 86_400_000), now), "1 week ago");
});

test("localInputsToIso turns the date and time inputs (local) into UTC", () => {
  assert.equal(localInputsToIso("2026-10-15", "14:30"), new Date(2026, 9, 15, 14, 30).toISOString());
});

test("defaultFollowUpInputs suggests the next whole hour, in local time", () => {
  assert.deepEqual(defaultFollowUpInputs(new Date(2026, 9, 14, 12, 20)), { date: "2026-10-14", time: "13:00" });
  // 23:30 rolls over to tomorrow
  assert.deepEqual(defaultFollowUpInputs(new Date(2026, 9, 14, 23, 30)), { date: "2026-10-15", time: "00:00" });
});

test("a won/lost lead whose follow-up already passed today is not pinned", () => {
  const { today, others } = splitLeads([lead(1, at(9), { status: "won" }), lead(2, at(15), { status: "lost" })], now);
  assert.deepEqual(
    today.map((l) => l.id),
    [2], // later today: still pinned
  );
  assert.deepEqual(
    others.map((l) => l.id),
    [1],
  );
});
