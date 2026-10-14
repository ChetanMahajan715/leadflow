import { STATUSES } from "@/lib/status";
import type { Lead, LeadStatus } from "@/lib/types";

export type StatusFilter = LeadStatus | "all";

type Props = {
  value: StatusFilter;
  leads: Lead[]; // the leads the counts are for (already matched to the search)
  onChange: (value: StatusFilter) => void;
};

// Single-select: exactly one chip is pressed. Wraps onto a second line on
// narrow screens instead of scrolling sideways.
export function FilterChips({ value, leads, onChange }: Props) {
  const options: { value: StatusFilter; label: string }[] = [{ value: "all", label: "All" }, ...STATUSES];

  return (
    <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] leading-4 font-bold tracking-[0.08em] text-ink-muted uppercase">
        Filter
      </span>
      {options.map((option) => {
        const pressed = option.value === value;
        const count =
          option.value === "all" ? leads.length : leads.filter((l) => l.status === option.value).length;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            className={`h-8 cursor-pointer rounded-full border px-3.5 text-[13px] leading-[18px] font-semibold transition-colors duration-150 ease-out ${
              pressed
                ? "border-brand bg-brand text-on-brand"
                : "border-line-strong bg-surface-raised text-ink hover:bg-surface-sunken"
            }`}
          >
            {option.label}
            <span className="ml-1.5 font-medium opacity-75">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
