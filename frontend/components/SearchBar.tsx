import { SearchIcon } from "@/components/icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name"
        aria-label="Search leads by name"
        className="h-10 w-full rounded-sm border border-line-strong bg-surface-raised pr-3 pl-9 text-sm text-ink placeholder:text-ink-muted"
      />
    </div>
  );
}
