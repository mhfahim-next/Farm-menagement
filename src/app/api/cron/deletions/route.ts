import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDueDeletions } from "@/lib/account-deletion";

// Deletes the accounts whose 30 days are up. The morning reminder run already
// does this every day; this route is for running it alone (any scheduler, with
// "Authorization: Bearer <CRON_SECRET>").
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
  const result = await runDueDeletions("schedule");
  if ("error" in result) return NextResponse.json(result, { status: 503 });
  return NextResponse.json(result);
}
