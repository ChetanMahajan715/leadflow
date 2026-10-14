import type { LeadStatus } from "./types";

// One place for everything about a status: its label and its badge colours.
// StatusBadge, FilterChips and the status dropdown all read this list, so
// adding a status is a one-line change. Order = pipeline order.
export const STATUSES: { value: LeadStatus; label: string; badgeClass: string }[] = [
  { value: "new", label: "New", badgeClass: "text-status-new bg-status-new-soft" },
  { value: "contacted", label: "Contacted", badgeClass: "text-status-contacted bg-status-contacted-soft" },
  { value: "qualified", label: "Qualified", badgeClass: "text-status-qualified bg-status-qualified-soft" },
  { value: "proposal_sent", label: "Proposal Sent", badgeClass: "text-status-proposal bg-status-proposal-soft" },
  { value: "won", label: "Won", badgeClass: "text-status-won bg-status-won-soft" },
  { value: "lost", label: "Lost", badgeClass: "text-status-lost bg-status-lost-soft" },
];

export function statusInfo(status: LeadStatus) {
  return STATUSES.find((s) => s.value === status) ?? STATUSES[0];
}
