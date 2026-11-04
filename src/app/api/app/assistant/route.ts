import { askAssistant, confirmProposal } from "@/app/dashboard/assistant/actions";
import { bodyOf, json, preflight, withAppFarm } from "@/lib/app-api";
import { STAFF } from "@/lib/auth";

// The AI assistant for the Android app: the same assistant, monthly prompt
// limit and confirm step as the website's chat. "ask" sends a message and gets
// a reply plus records to confirm; "confirm" saves one through the same form
// action the website uses, so every rule still applies.

export const OPTIONS = preflight;

/** Prompts used and allowed this month. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return withAppFarm(request, url.searchParams.get("farm"), url.searchParams.get("lang"), async ({ supabase, farm, role }) => {
    if (!STAFF.includes(role)) return json({ error: "Not allowed." }, 403);
    const { data } = await supabase.rpc("ai_prompts_status", { p_farm: farm.id });
    const s = data as { used?: number; max?: number | null } | null;
    return json({ used: s?.used ?? 0, max: s?.max ?? null });
  });
}

export async function POST(request: Request) {
  const body = await bodyOf(request);
  if (!body) return json({ error: "Bad request." }, 400);
  return withAppFarm(request, body.farm, body.lang, async ({ role }) => {
    if (!STAFF.includes(role)) return json({ error: "Not allowed." }, 403);
    if (body.action === "ask") {
      const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
      const res = await askAssistant(history, typeof body.text === "string" ? body.text.slice(0, 2000) : "");
      return json(res);
    }
    if (body.action === "confirm") {
      const res = await confirmProposal(typeof body.kind === "string" ? body.kind : "", Array.isArray(body.fields) ? (body.fields as [string, string][]) : []);
      return res && "error" in res && res.error ? json({ error: res.error }, 422) : json({ message: res && "success" in res ? res.success : "" });
    }
    return json({ error: "Bad request." }, 400);
  });
}
