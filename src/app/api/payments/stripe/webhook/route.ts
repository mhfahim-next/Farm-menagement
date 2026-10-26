import { NextResponse } from "next/server";
import { confirmStripeSession, markOnlineFailed, stripeSignatureOk, type StripeSession } from "@/lib/payment-providers";

/**
 * Stripe → FarmFlows events (Developers → Webhooks → add endpoint
 * https://<site>/api/payments/stripe/webhook). Only signed events are used.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const raw = await request.text();
  if (!stripeSignatureOk(raw, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: StripeSession } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  const session = event.data?.object;
  if (!session) return NextResponse.json({ received: true });

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const result = await confirmStripeSession(session);
      // A failure on our side makes Stripe try again later.
      if (result === "error") return NextResponse.json({ error: "retry" }, { status: 500 });
      return NextResponse.json({ received: true, result });
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const pid = session.metadata?.payment_id ?? session.client_reference_id;
      if (pid) await markOnlineFailed(pid, "stripe");
      return NextResponse.json({ received: true });
    }
    default:
      return NextResponse.json({ received: true });
  }
}
