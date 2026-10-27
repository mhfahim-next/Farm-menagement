import { approveEntry, cancelEntry, rejectEntry } from "@/app/dashboard/approvals/actions";
import { bodyOf, formOf, json, preflight, withAppFarm } from "@/lib/app-api";
import type { PendingEntry } from "@/lib/approvals";
import { describeEntries } from "@/lib/approvals-describe";
import { MANAGERS } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

// Doctors' entries waiting for approval, for the Android app: the same list,
// wording and decisions as the website's Approvals page.

export const OPTIONS = preflight;

export async function GET(request: Request) {
  const url = new URL(request.url);
  return withAppFarm(request, url.searchParams.get("farm"), url.searchParams.get("lang"), async ({ supabase, farm, role, user }) => {
    const manager = MANAGERS.includes(role);
    if (!manager && role !== "vet") return json({ error: "Not allowed." }, 403);
    const i18n = await getI18n();
    const { data, error } = await supabase.from("pending_entries").select("*").eq("farm_id", farm.id).order("created_at", { ascending: false }).limit(100);
    if (error) return json({ error: error.message }, 500);
    const entries = ((data ?? []) as PendingEntry[]).filter((e) => manager || e.submitted_by === user.id);
    const described = await describeEntries({ supabase, farm, i18n }, entries);
    const ids = [...new Set(entries.flatMap((e) => [e.submitted_by, e.resolved_by]).filter((x): x is string => !!x))];
    const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
    const nameOf = new Map((people ?? []).map((p) => [p.id as string, (p.full_name || "—") as string]));
    const item = (e: PendingEntry) => ({
      id: e.id,
      kind: e.kind,
      status: e.status,
      title: described.get(e.id)?.title ?? "",
      lines: described.get(e.id)?.lines ?? [],
      by: e.submitted_by ? (nameOf.get(e.submitted_by) ?? null) : null,
      decidedBy: e.resolved_by ? (nameOf.get(e.resolved_by) ?? null) : null,
      note: e.note,
      created_at: e.created_at,
    });
    return json({
      canDecide: manager,
      waiting: entries.filter((e) => e.status === "pending").map(item),
      done: entries.filter((e) => e.status !== "pending").slice(0, 30).map(item),
    });
  });
}

export async function POST(request: Request) {
  const body = await bodyOf(request);
  if (!body) return json({ error: "Bad request." }, 400);
  return withAppFarm(request, body.farm, body.lang, async () => {
    const id = typeof body.id === "string" ? body.id : "";
    const fd = formOf([], { id, note: typeof body.note === "string" ? body.note.slice(0, 500) : "" });
    const run = body.action === "approve" ? approveEntry : body.action === "reject" ? rejectEntry : body.action === "cancel" ? cancelEntry : null;
    if (!run || !id) return json({ error: "Bad request." }, 400);
    const result = await run(null, fd);
    return result && "error" in result && result.error ? json({ error: result.error }, 409) : json({ message: result && "success" in result ? result.success : "" });
  });
}
