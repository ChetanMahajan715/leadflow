"use client";

import { type FormEvent, type MouseEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Field } from "@/components/Field";
import { CloseIcon } from "@/components/icons";
import { ApiError, api } from "@/lib/api";
import type { Lead } from "@/lib/types";

type Props = {
  onClose: () => void;
  onCreated: (lead: Lead) => void;
};

// Closing through the <dialog> element (not just unmounting) lets the browser
// return focus to the "Add lead" button.
const closeDialog = (e: MouseEvent<HTMLElement>) => e.currentTarget.closest("dialog")?.close();

export function AddLeadDialog({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [attempted, setAttempted] = useState(false); // errors only show after the first "Save lead"
  const [saving, setSaving] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const nameError = attempted && !name.trim() ? "Name is required." : apiErrors.name;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);
    if (!name.trim()) return;

    const form = e.currentTarget;
    setSaving(true);
    setApiErrors({});
    setFormError(null);
    try {
      const lead = await api.createLead({ name, company, phone }); // the API trims and treats blanks as empty
      onCreated(lead);
      form.closest("dialog")?.close();
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(0, "Something went wrong.");
      setApiErrors(apiError.fieldErrors);
      if (Object.keys(apiError.fieldErrors).length === 0) setFormError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog labelledBy="add-lead-title" onClose={onClose}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id="add-lead-title" className="text-xl leading-7 font-bold">
          Add lead
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={closeDialog}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <CloseIcon size={20} />
        </button>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col">
        <div className="flex flex-col gap-4 px-5 py-5">
          <Field
            id="lead-name"
            label="Full name"
            required
            data-autofocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            maxLength={100}
            autoComplete="off"
            error={nameError}
          />
          <Field
            id="lead-company"
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Sharma Wealth Partners"
            maxLength={100}
            autoComplete="off"
            error={apiErrors.company}
          />
          <Field
            id="lead-phone"
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            maxLength={30}
            autoComplete="off"
            error={apiErrors.phone}
          />
          {formError && (
            <p role="alert" className="text-xs text-danger">
              {formError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <Button variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save lead"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
