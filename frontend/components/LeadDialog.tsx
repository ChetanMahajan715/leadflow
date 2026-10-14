"use client";

import { useEffect, useState } from "react";
import { Dialog, closeParentDialog } from "@/components/Dialog";
import { NoteForm } from "@/components/NoteForm";
import { Timeline } from "@/components/Timeline";
import { CloseIcon, PhoneIcon } from "@/components/icons";
import { ApiError, api } from "@/lib/api";
import { STATUSES } from "@/lib/status";
import type { Discussion, DiscussionCreated, Lead, LeadStatus } from "@/lib/types";

type Props = {
  lead: Lead;
  onClose: () => void;
  onLeadChange: (lead: Lead) => void; // tell the page the lead changed, so the list updates at once
};

// The lead's timeline, opened over the list (never a new page).
export function LeadDialog({ lead, onClose, onLeadChange }: Props) {
  const [discussions, setDiscussions] = useState<Discussion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Load this lead's notes when the dialog opens.
  useEffect(() => {
    let ignore = false;
    api
      .listDiscussions(lead.id)
      .then((data) => {
        if (ignore) return;
        setDiscussions(data);
        setNow(new Date());
      })
      .catch((e) => {
        if (!ignore) setLoadError(e instanceof ApiError ? e.message : "Could not load the timeline.");
      });
    return () => {
      ignore = true;
    };
  }, [lead.id]);

  // The dropdown saves as soon as it changes. It always shows lead.status,
  // so if saving fails it simply stays on the old value.
  async function changeStatus(status: LeadStatus) {
    setStatusSaving(true);
    setStatusError(null);
    try {
      onLeadChange(await api.updateLead(lead.id, { status }));
    } catch (e) {
      setStatusError(e instanceof ApiError ? e.message : "Could not save the status.");
    } finally {
      setStatusSaving(false);
    }
  }

  function noteSaved(result: DiscussionCreated) {
    setDiscussions((current) => [result.discussion, ...(current ?? [])]); // newest on top
    setNow(new Date());
    onLeadChange(result.lead);
  }

  return (
    <Dialog labelledBy="lead-dialog-title" onClose={onClose}>
      {/* Head */}
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 id="lead-dialog-title" className="text-xl leading-7 font-bold">
            {lead.name}
            {lead.company && <span className="ml-2 font-medium text-ink-muted">{lead.company}</span>}
          </h2>
          {lead.phone && (
            <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-ink-muted">
              <PhoneIcon size={14} />
              {lead.phone}
            </p>
          )}
          {statusError && (
            <p role="alert" className="mt-1 text-xs text-ink-muted">
              {statusError}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <select
            aria-label="Status"
            value={lead.status}
            disabled={statusSaving}
            onChange={(e) => changeStatus(e.target.value as LeadStatus)}
            className="h-[34px] cursor-pointer rounded-sm border border-line-strong bg-surface-raised px-2 text-[13px] font-semibold text-ink disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Close"
            onClick={closeParentDialog}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <CloseIcon size={20} />
          </button>
        </div>
      </div>

      {/* Body: only this part scrolls */}
      <div className="min-h-[120px] flex-1 overflow-y-auto bg-surface-sunken px-5 py-5">
        {loadError ? (
          <p role="alert" className="text-ink-muted">
            {loadError}
          </p>
        ) : discussions === null || now === null ? (
          <p className="text-ink-muted">Loading timeline…</p>
        ) : discussions.length === 0 ? (
          <p className="text-ink-muted">No notes yet. Log the first discussion below.</p>
        ) : (
          <Timeline discussions={discussions} now={now} />
        )}
      </div>

      {/* Foot */}
      <NoteForm leadId={lead.id} onSaved={noteSaved} disabled={discussions === null} />
    </Dialog>
  );
}
