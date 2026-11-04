// Calls the website's /api/app routes with the signed-in person's session
// (row-level security applies there exactly as in the app).
import { useCached } from "./cache";
import { siteLink } from "./env";
import type { Locale } from "./i18n/core";
import { supabase } from "./supabase";

async function call<T>(path: string, init?: { method: "POST"; body: unknown }): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("signed out");
  const res = await fetch(siteLink(path), {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(init ? { "Content-Type": "application/json" } : {}) },
    body: init ? JSON.stringify(init.body) : undefined,
  });
  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body as T;
}

export type ApprovalItem = {
  id: string;
  kind: string;
  status: "pending" | "approved" | "rejected";
  title: string;
  lines: string[];
  by: string | null;
  decidedBy: string | null;
  note: string | null;
  created_at: string;
};
export type Approvals = { canDecide: boolean; waiting: ApprovalItem[]; done: ApprovalItem[] };

export const fetchApprovals = (farmId: string, locale: Locale) => call<Approvals>(`/api/app/approvals?farm=${farmId}&lang=${locale}`);

export const useApprovals = (farmId: string | undefined, locale: Locale) =>
  useCached(farmId ? `approvals.${farmId}.${locale}` : null, () => fetchApprovals(farmId!, locale));

/** Approve, reject (with a reason) or, for the doctor who sent it, withdraw an entry. */
export const decideApproval = (farmId: string, locale: Locale, id: string, action: "approve" | "reject" | "cancel", note = "") =>
  call<{ message: string }>("/api/app/approvals", { method: "POST", body: { farm: farmId, lang: locale, id, action, note } });

/** A doctor's health or breeding entry, sent for the owner or a manager to approve. */
export const submitForApproval = (farmId: string, locale: Locale, kind: "record_health" | "update_health" | "log_breeding" | "update_breeding", fields: [string, string][]) =>
  call<{ message: string }>("/api/app/submit", { method: "POST", body: { farm: farmId, lang: locale, kind, fields } });

// ---------------------------------------------------------------- AI assistant

export type AiProposal = { id: string; kind: string; title: string; lines: string[]; fields: [string, string][] };
export type AiStatus = { used: number; max: number | null };
export type AiTurn = { role: "user" | "assistant"; text: string };
export type AiAnswer = { error?: string; reply?: string; proposals?: AiProposal[]; status?: AiStatus; limitReached?: boolean };

/** Prompts used and allowed this month. */
export const fetchAiStatus = (farmId: string, locale: Locale) => call<AiStatus>(`/api/app/assistant?farm=${farmId}&lang=${locale}`);

/** One message to the assistant (counts as one prompt); the reply and any records it prepared. */
export const askAi = (farmId: string, locale: Locale, history: AiTurn[], text: string) =>
  call<AiAnswer>("/api/app/assistant", { method: "POST", body: { farm: farmId, lang: locale, action: "ask", history, text } });

/** Save a prepared record the farmer confirmed (through the website's normal form action). */
export const confirmAi = (farmId: string, locale: Locale, p: AiProposal) =>
  call<{ message: string }>("/api/app/assistant", { method: "POST", body: { farm: farmId, lang: locale, action: "confirm", kind: p.kind, fields: p.fields } });
