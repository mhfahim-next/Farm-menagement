import { NextResponse, type NextRequest } from "next/server";
import { confirmStripeSession, markOnlineFailed, stripeSession } from "@/lib/payment-providers";

/** Stripe sends the payer back here. The payment is checked with Stripe, not taken from the address. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const pid = sp.get("pid") ?? "";
  const back = (result: string) => NextResponse.redirect(new URL(`/dashboard/plan?pay=${result}`, request.url), 303);

  if (sp.get("cancelled")) {
    await markOnlineFailed(pid, "stripe");
    return back("cancelled");
  }
  const sessionId = sp.get("session_id");
  if (!sessionId) return back("failed");
  try {
    const session = await stripeSession(sessionId);
    if ((session.metadata?.payment_id ?? session.client_reference_id) !== pid) return back("failed");
    const result = await confirmStripeSession(session);
    // Bank debits and the like finish later; the webhook confirms them then.
    return back(result === "paid" || result === "already" ? "paid" : result === "unpaid" ? "processing" : "failed");
  } catch (e) {
    console.error("Stripe return:", e);
    return back("processing");
  }
}
