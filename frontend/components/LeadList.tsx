import type { ReactNode } from "react";
import { LeadCard } from "@/components/LeadCard";
import { PinIcon } from "@/components/icons";
import { splitLeads } from "@/lib/time";
import type { Lead } from "@/lib/types";

type Props = {
  leads: Lead[]; // already filtered by status and search
  now: Date;
  onOpen: (lead: Lead) => void;
};

// The two sections: today's follow-ups pinned on top, then everyone else.
export function LeadList({ leads, now, onOpen }: Props) {
  const { today, others } = splitLeads(leads, now);

  return (
    <div className="flex flex-col gap-8">
      {today.length > 0 && (
        <Section title="Today's follow-ups" icon={<PinIcon size={14} />}>
          {today.map((lead) => (
            <LeadCard key={lead.id} lead={lead} now={now} onOpen={onOpen} />
          ))}
        </Section>
      )}
      {others.length > 0 && (
        <Section title="All leads">
          {others.map((lead) => (
            <LeadCard key={lead.id} lead={lead} now={now} onOpen={onOpen} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 flex items-center gap-1.5 text-[11px] leading-4 font-bold tracking-[0.08em] text-ink-muted uppercase">
        {icon}
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
