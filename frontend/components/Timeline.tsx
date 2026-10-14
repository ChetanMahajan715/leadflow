import { FollowUpChip } from "@/components/FollowUpChip";
import { formatDateTime, isSameLocalDay, timeAgo } from "@/lib/time";
import type { Discussion } from "@/lib/types";

type Props = {
  discussions: Discussion[]; // newest first, as the API returns them
  now: Date;
};

// Vertical timeline: a line on the left, one dot per note (the newest in brand
// colour), exact time + relative time, and a chip on notes that set a follow-up.
export function Timeline({ discussions, now }: Props) {
  return (
    <ol className="relative flex flex-col gap-4 pl-6 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-0.5 before:bg-line">
      {discussions.map((d, i) => (
        <li key={d.id} className="relative">
          <span
            aria-hidden="true"
            className={`absolute top-[3px] -left-6 h-2.5 w-2.5 rounded-full shadow-[0_0_0_3px_var(--surface-sunken)] ${
              i === 0 ? "bg-brand" : "bg-line-strong"
            }`}
          />
          <p className="mb-1.5 font-mono text-xs leading-4 font-medium text-ink-muted">
            <time dateTime={d.created_at}>{formatDateTime(d.created_at, now)}</time> · {timeAgo(d.created_at, now)}
          </p>
          <div className="rounded-md border border-line bg-surface-raised px-4 py-3">
            <p className="whitespace-pre-wrap">{d.note}</p>
            {d.follow_up_at && (
              <div className="mt-2">
                <FollowUpChip
                  at={d.follow_up_at}
                  // Brand style if it is still ahead today; neutral otherwise (past ones were handled).
                  state={new Date(d.follow_up_at) > now && isSameLocalDay(d.follow_up_at, now) ? "today" : "upcoming"}
                  label={`Follow-up set for ${formatDateTime(d.follow_up_at, now)}`}
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
