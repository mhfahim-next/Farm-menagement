// Stripe webhook signature check: pure (no app imports) so it can be unit-tested.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Checks a webhook's Stripe-Signature header ("t=…,v1=…") against the raw body.
 * Rejects events older than five minutes so a captured one can't be replayed.
 */
export function stripeSignatureOk(raw: string, header: string | null, secret: string, now = Date.now()) {
  if (!header) return false;
  const parts = header.split(",").map((x) => x.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || sigs.length === 0 || !/^\d+$/.test(t)) return false;
  if (Math.abs(now / 1000 - Number(t)) > 300) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex"));
  return sigs.some((s) => {
    const got = Buffer.from(s ?? "");
    return got.length === want.length && timingSafeEqual(got, want);
  });
}
