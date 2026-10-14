"use client";

// The one screen. This component owns the state (the list of leads, filters,
// search) and passes pieces of it down to small components as props.

import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { FilterChips, type StatusFilter } from "@/components/FilterChips";
import { Header } from "@/components/Header";
import { AlertIcon } from "@/components/icons";
import { LeadList } from "@/components/LeadList";
import { SearchBar } from "@/components/SearchBar";
import { ApiError, api } from "@/lib/api";
import { STATUSES } from "@/lib/status";
import type { Lead } from "@/lib/types";

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState(""); // what is in the box right now
  const [debouncedSearch, setDebouncedSearch] = useState(""); // what we filter by
  // The current time, set in the browser once leads arrive. Not read during
  // render: Next.js prerenders this page at build time, when "now" is wrong.
  const [now, setNow] = useState<Date | null>(null);
  const [reloads, setReloads] = useState(0); // bump to fetch again ("Try again")

  // Fetch the leads when the page opens, and again whenever `reloads` changes.
  useEffect(() => {
    let ignore = false; // set when this effect is replaced, so a stale answer is dropped
    api
      .listLeads()
      .then((data) => {
        if (ignore) return;
        setLeads(data);
        setNow(new Date());
        setError(null);
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof ApiError ? e.message : "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [reloads]);

  // Debounce: only filter 250 ms after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Re-render every minute so "5 minutes ago" and today/overdue stay correct.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  function retry() {
    setLoading(true);
    setError(null);
    setReloads((n) => n + 1);
  }

  // Search applies first, so the chip counts show how many match the search.
  const searched = leads.filter((l) => l.name.toLowerCase().includes(debouncedSearch));
  const counts = { all: searched.length } as Record<StatusFilter, number>;
  for (const s of STATUSES) counts[s.value] = searched.filter((l) => l.status === s.value).length;
  const visible = filter === "all" ? searched : searched.filter((l) => l.status === filter);

  function openLead(lead: Lead) {
    // The timeline dialog is added in the next step (Phase 8).
    console.info("open lead", lead.id);
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-[960px] flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4">
          <SearchBar value={search} onChange={setSearch} />
          <FilterChips value={filter} counts={counts} onChange={setFilter} />
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface-raised p-4 shadow-card"
          >
            <AlertIcon size={20} className="text-ink-muted" />
            <p className="flex-1">{error}</p>
            <Button onClick={retry}>Try again</Button>
          </div>
        ) : leads.length === 0 ? (
          <EmptyState text="No leads yet. Add your first one to get started." />
        ) : visible.length === 0 ? (
          <EmptyState text="No leads match your search or filter.">
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Clear search and filter
            </Button>
          </EmptyState>
        ) : (
          now && <LeadList leads={visible} now={now} onOpen={openLead} />
        )}
      </main>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading leads" className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[104px] animate-pulse rounded-md border border-line bg-surface-raised" />
      ))}
    </div>
  );
}

function EmptyState({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong px-6 py-12 text-center text-ink-muted">
      <p>{text}</p>
      {children}
    </div>
  );
}
