import { AlertIcon, BellIcon, CalendarIcon } from "@/components/icons";
import { formatDateTime, formatTime, type FollowUpState } from "@/lib/time";

const STYLES = {
  today: { className: "text-brand bg-brand-soft", Icon: BellIcon },
  overdue: { className: "text-danger bg-danger-soft", Icon: AlertIcon },
  upcoming: { className: "text-ink-muted bg-surface-sunken", Icon: CalendarIcon },
};

type Props = {
  at: string; // the follow-up time (UTC ISO string)
  state: FollowUpState;
  label?: string; // replaces the default text, e.g. in the timeline
};

// Commitments always show the exact time, never "in 3 hours".
export function FollowUpChip({ at, state, label }: Props) {
  const { className, Icon } = STYLES[state];
  const text =
    label ??
    {
      today: `Follow up today, ${formatTime(at)}`,
      overdue: `Overdue · ${formatDateTime(at)}`,
      upcoming: formatDateTime(at),
    }[state];

  return (
    <span
      className={`inline-flex h-[26px] items-center gap-1 rounded-sm px-2 text-xs font-semibold whitespace-nowrap ${className}`}
    >
      <Icon size={14} />
      {text}
    </span>
  );
}
