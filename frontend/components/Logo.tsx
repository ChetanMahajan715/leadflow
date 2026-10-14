// The LeadFlow wordmark: the rising-wave mark in a teal tile, then "Lead" in ink
// and "Flow" in brand. Drawn inline (not an <img>) so the text uses the page font
// and the colours follow the light/dark tokens, like the kit's two wordmark files.
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-[21px] font-bold tracking-[-0.4px]">
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--brand)" />
        <g fill="none" stroke="var(--on-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 21.5c3.2 0 4-6.5 7.5-6.5s3.6 3.5 6.5 3.5c1.6 0 2.8-1.6 4-4.5" />
          <path d="M21.6 13.4l3.6-.6.6 3.6" />
        </g>
      </svg>
      <span>
        <span className="text-ink">Lead</span>
        <span className="text-brand">Flow</span>
      </span>
    </span>
  );
}
