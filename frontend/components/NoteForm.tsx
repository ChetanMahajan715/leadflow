"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { ApiError, api } from "@/lib/api";
import { defaultFollowUpInputs, localInputsToIso } from "@/lib/time";
import type { DiscussionCreated } from "@/lib/types";

type Props = {
  leadId: number;
  onSaved: (result: DiscussionCreated) => void;
};

const inputClass =
  "h-9 rounded-sm border border-line-strong bg-surface-raised px-3 text-sm text-ink disabled:opacity-50 aria-[invalid=true]:border-danger";

// The form at the bottom of the lead dialog: a note, plus an optional follow-up.
export function NoteForm({ leadId, onSaved }: Props) {
  const [note, setNote] = useState("");
  const [withFollowUp, setWithFollowUp] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ note?: string; followUp?: string; form?: string }>({});

  function toggleFollowUp(checked: boolean) {
    setWithFollowUp(checked);
    if (checked && !date) {
      const suggestion = defaultFollowUpInputs();
      setDate(suggestion.date);
      setTime(suggestion.time);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); // stay on the page instead of the browser's own form submit

    // Check the easy things here; the API checks them again.
    const found: typeof errors = {};
    if (!note.trim()) found.note = "Write a note first.";
    let followUpAt: string | undefined;
    if (withFollowUp) {
      if (!date || !time) found.followUp = "Pick a date and a time.";
      else {
        followUpAt = localInputsToIso(date, time);
        if (new Date(followUpAt) <= new Date()) found.followUp = "Pick a time in the future.";
      }
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const result = await api.addDiscussion(leadId, { note: note.trim(), follow_up_at: followUpAt });
      onSaved(result);
      setNote("");
      setWithFollowUp(false);
      setDate("");
      setTime("");
    } catch (err) {
      const e = err instanceof ApiError ? err : new ApiError(0, "Something went wrong.");
      setErrors({
        note: e.fieldErrors.note,
        followUp: e.fieldErrors.follow_up_at,
        form: Object.keys(e.fieldErrors).length ? undefined : e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 border-t border-line px-5 py-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-note" className="sr-only">
          New discussion note
        </label>
        <textarea
          id="new-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Log a new discussion…"
          maxLength={2000}
          aria-invalid={!!errors.note}
          aria-describedby={errors.note ? "new-note-error" : undefined}
          className="min-h-[72px] resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-muted aria-[invalid=true]:border-danger"
        />
        {errors.note && (
          <p id="new-note-error" className="text-xs text-danger">
            {errors.note}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="mr-1 inline-flex items-center gap-2 text-[13px] font-semibold">
          <input
            type="checkbox"
            checked={withFollowUp}
            onChange={(e) => toggleFollowUp(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Set follow-up
        </label>
        <input
          type="date"
          aria-label="Follow-up date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={!withFollowUp}
          aria-invalid={!!errors.followUp}
          className={inputClass}
        />
        <input
          type="time"
          aria-label="Follow-up time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={!withFollowUp}
          aria-invalid={!!errors.followUp}
          className={inputClass}
        />
        <Button type="submit" variant="primary" disabled={saving} className="ml-auto">
          {saving ? "Saving…" : "Save note"}
        </Button>
      </div>
      {errors.followUp && <p className="-mt-1 text-xs text-danger">{errors.followUp}</p>}
      {errors.form && (
        <p role="alert" className="text-xs text-danger">
          {errors.form}
        </p>
      )}
    </form>
  );
}
