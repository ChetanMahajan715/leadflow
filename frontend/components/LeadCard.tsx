import { FollowUpChip } from "@/components/FollowUpChip";
import { StatusBadge } from "@/components/StatusBadge";
import { ClockIcon } from "@/components/icons";
import { followUpState, timeAgo } from "@/lib/time";
import type { Lead } from "@/lib/types";

type Props = {
  lead: Lead;
  now: Date;
  onOpen: (lead: Lead) => void;
};

// One lead in the list. The whole card is a <button>, so it can be clicked or
// opened with the keyboard (Tab, then Enter or Space).
export function LeadCard({ lead, now, onOpen }: Props) {
  const state = followUpState(lead, now);
  const closed = lead.status === "won" || lead.status === "lost";

  let look = "bg-surface-raised border-line";
  if (state === "overdue") look = "bg-surface-raised border-danger";
  else if (state === "today") look = "bg-brand-soft border-brand";

  return (
    <button
      type="button"
      data-lead-id={lead.id}
      onClick={() => onOpen(lead)}
      className={`block w-full cursor-pointer rounded-md border p-4 text-left shadow-card transition-shadow duration-150 ease-out hover:shadow-hover ${look} ${closed ? "opacity-[0.72]" : ""}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="text-base leading-6 font-bold text-ink">{lead.name}</span>
          {lead.company && (
            <span className="ml-1.5 text-[13px] font-medium text-ink-muted">{lead.company}</span>
          )}
        </span>
        <StatusBadge status={lead.status} />
      </span>

      <span className="mt-1 line-clamp-1 text-sm text-ink">
        {lead.last_note ? (
          <>
            <b className="font-semibold">Last note:</b> {lead.last_note}
          </>
        ) : (
          <span className="text-ink-muted">No notes yet</span>
        )}
      </span>

      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
        {lead.last_note_at && (
          <span className="inline-flex items-center gap-1">
            <ClockIcon size={14} />
            {timeAgo(lead.last_note_at, now)}
          </span>
        )}
        {lead.follow_up_at && state && <FollowUpChip at={lead.follow_up_at} state={state} />}
      </span>
    </button>
  );
}
