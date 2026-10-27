import { logBreedingEvent, updateBreedingEvent } from "@/app/dashboard/breeding/actions";
import { recordHealth, updateHealth } from "@/app/dashboard/health/actions";
import { bodyOf, formOf, json, preflight, withAppFarm } from "@/lib/app-api";

// A doctor's health or breeding entry from the Android app. It goes through
// the website's own form actions, which queue a vet's entry for the owner or a
// manager to approve (lib/approvals.ts, queueIfVet). Farm staff save directly
// from the app, so this route is for vets only.

export const OPTIONS = preflight;

const ACTIONS = {
  record_health: recordHealth,
  update_health: updateHealth,
  log_breeding: logBreedingEvent,
  update_breeding: updateBreedingEvent,
} as const;

export async function POST(request: Request) {
  const body = await bodyOf(request);
  if (!body) return json({ error: "Bad request." }, 400);
  return withAppFarm(request, body.farm, body.lang, async ({ role }) => {
    if (role !== "vet") return json({ error: "Only doctors send entries for approval." }, 403);
    const run = typeof body.kind === "string" && body.kind in ACTIONS ? ACTIONS[body.kind as keyof typeof ACTIONS] : null;
    if (!run) return json({ error: "Bad request." }, 400);
    const result = await run(null, formOf(body.fields));
    return result && "error" in result && result.error ? json({ error: result.error }, 422) : json({ message: result && "success" in result ? result.success : "" });
  });
}
