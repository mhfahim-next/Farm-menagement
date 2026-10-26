import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { farmClock } from "@/lib/format";
import { runReminderJob } from "@/lib/reminder-job";

// Called by Vercel Cron (vercel.json) at 7:00 and 20:00 Bangladesh time, with
// "Authorization: Bearer <CRON_SECRET>". Any other scheduler can call it the
// same way, with ?slot=morning|evening.
export const maxDuration = 300;

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const asked = new URL(request.url).searchParams.get("slot");
  const slot = asked === "morning" || asked === "evening" ? asked : farmClock().hour < 12 ? "morning" : "evening";
  const result = await runReminderJob(slot);
  if ("error" in result) return NextResponse.json(result, { status: 503 });
  return NextResponse.json(result);
}
