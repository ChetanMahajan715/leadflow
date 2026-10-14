// The shapes of the JSON the API sends back (see backend/app/schemas.py).
// Times are ISO strings in UTC, e.g. "2026-10-14T08:59:04.124769Z".

export type LeadStatus = "new" | "contacted" | "qualified" | "proposal_sent" | "won" | "lost";

export interface Lead {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  last_note: string | null;
  last_note_at: string | null;
}

export interface Discussion {
  id: number;
  lead_id: number;
  note: string;
  follow_up_at: string | null;
  created_at: string;
}

// Returned after logging a note: the note and the lead as it is now.
export interface DiscussionCreated {
  discussion: Discussion;
  lead: Lead;
}
