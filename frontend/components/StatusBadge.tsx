import { statusInfo } from "@/lib/status";
import type { LeadStatus } from "@/lib/types";

// Read-only pill. It always shows the word, so colour is never the only signal.
export function StatusBadge({ status }: { status: LeadStatus }) {
  const { label, badgeClass } = statusInfo(status);
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[11px] font-bold tracking-[0.08em] whitespace-nowrap uppercase ${badgeClass}`}
    >
      {label}
    </span>
  );
}
