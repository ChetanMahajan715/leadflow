// The only file that talks to the backend. Components call these functions
// and never use fetch() directly.

import type { Discussion, DiscussionCreated, Lead, LeadStatus } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** An error the UI can show: a message, plus per-field messages for 422s. */
export class ApiError extends Error {
  status: number; // HTTP status, or 0 when the server could not be reached
  fieldErrors: Record<string, string>; // e.g. { name: "String should have at least 1 character" }

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// FastAPI 422 body: {"detail": [{"loc": ["body", "name"], "msg": "..."}]}
type ValidationIssue = { loc: (string | number)[]; msg: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // fetch only throws when the server could not be reached at all.
    throw new ApiError(0, "Can't reach the server. Check that the API is running.");
  }

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (response.ok) return body as T;

  const detail = body?.detail;
  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of detail as ValidationIssue[]) {
      // Pydantic prefixes custom messages with "Value error, "; drop that.
      fieldErrors[String(issue.loc.at(-1))] = issue.msg.replace(/^Value error, /, "");
    }
    throw new ApiError(response.status, "Please check the highlighted fields.", fieldErrors);
  }
  throw new ApiError(response.status, typeof detail === "string" ? detail : "Something went wrong.");
}

export const api = {
  listLeads: () => request<Lead[]>("/leads"),

  createLead: (input: { name: string; company?: string; phone?: string }) =>
    request<Lead>("/leads", { method: "POST", body: JSON.stringify(input) }),

  updateLead: (id: number, changes: { status?: LeadStatus }) =>
    request<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),

  listDiscussions: (id: number) => request<Discussion[]>(`/leads/${id}/discussions`),

  addDiscussion: (id: number, input: { note: string; follow_up_at?: string }) =>
    request<DiscussionCreated>(`/leads/${id}/discussions`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
