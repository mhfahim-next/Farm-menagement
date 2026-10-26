import "server-only";
// Online payments: Stripe Checkout and SSLCommerz, over their plain HTTP APIs.
// Keys come from the environment only (never the database or the browser):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD, SSLCOMMERZ_LIVE=true (else sandbox)
//   SUPABASE_SERVICE_ROLE_KEY (to mark a checked payment paid)
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
export { stripeSignatureOk } from "@/lib/stripe-signature";
import { SUPABASE_URL } from "@/lib/supabase/env";

const env = (k: string) => process.env[k]?.trim() || null;

/** Supabase with the service-role key: only for confirming online payments. */
export function serviceClient() {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type ProviderStatus = {
  serviceKey: boolean;
  stripe: { key: boolean; webhook: boolean; mode: "test" | "live" | null };
  sslcommerz: { key: boolean; mode: "sandbox" | "live" };
};

export function providerStatus(): ProviderStatus {
  const sk = env("STRIPE_SECRET_KEY");
  return {
    serviceKey: Boolean(env("SUPABASE_SERVICE_ROLE_KEY")),
    stripe: {
      key: Boolean(sk),
      webhook: Boolean(env("STRIPE_WEBHOOK_SECRET")),
      mode: sk ? (sk.startsWith("sk_live") || sk.startsWith("rk_live") ? "live" : "test") : null,
    },
    sslcommerz: {
      key: Boolean(env("SSLCOMMERZ_STORE_ID") && env("SSLCOMMERZ_STORE_PASSWORD")),
      mode: env("SSLCOMMERZ_LIVE") === "true" ? "live" : "sandbox",
    },
  };
}

/** Whether an online method can take money right now (keys set). Manual methods always can. */
export function providerReady(kind: string) {
  const s = providerStatus();
  if (kind === "stripe") return s.serviceKey && s.stripe.key;
  if (kind === "sslcommerz") return s.serviceKey && s.sslcommerz.key;
  return true;
}

/** Where providers send the payer back. Uses the address the request came in on when it differs (e.g. previews). */
export function appUrl(path: string, origin?: string | null) {
  return new URL(path, origin || SITE_URL).toString();
}

// ---------------------------------------------------------------------
// Stripe
// ---------------------------------------------------------------------

export type StripeSession = {
  id: string;
  url: string | null;
  status: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
  payment_intent: string | null;
};

async function stripeApi<T>(path: string, init?: { body?: URLSearchParams; idempotencyKey?: string }): Promise<T> {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe is not set up.");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init?.body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(init?.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
    },
    body: init?.body,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Stripe error ${res.status}`);
  return json;
}

/** Stripe counts both taka and dollars in hundredths (poisha / cents). */
const toMinor = (amount: number) => Math.round(amount * 100);

export async function stripeCheckout(p: {
  paymentId: string;
  amount: number;
  currency: string;
  productName: string;
  email: string | null;
  locale: string;
  origin?: string | null;
}) {
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": p.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(toMinor(p.amount)),
    "line_items[0][price_data][product_data][name]": p.productName,
    client_reference_id: p.paymentId,
    "metadata[payment_id]": p.paymentId,
    "payment_intent_data[metadata][payment_id]": p.paymentId,
    success_url: appUrl(`/api/payments/stripe/return?pid=${p.paymentId}&session_id={CHECKOUT_SESSION_ID}`, p.origin),
    cancel_url: appUrl(`/api/payments/stripe/return?pid=${p.paymentId}&cancelled=1`, p.origin),
    locale: p.locale === "bn" ? "auto" : "en",
  });
  if (p.email) body.set("customer_email", p.email);
  return stripeApi<StripeSession>("checkout/sessions", { body, idempotencyKey: `checkout-${p.paymentId}` });
}

export function stripeSession(id: string) {
  return stripeApi<StripeSession>(`checkout/sessions/${encodeURIComponent(id)}`);
}

export type ConfirmResult = "paid" | "already" | "mismatch" | "missing" | "unpaid" | "error";

/** Marks the payment behind a Stripe Checkout session paid, if Stripe says it is. */
export async function confirmStripeSession(session: StripeSession): Promise<ConfirmResult> {
  const pid = session.metadata?.payment_id ?? session.client_reference_id;
  if (!pid) return "missing";
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return "unpaid";
  const db = serviceClient();
  if (!db) return "error";
  const { data, error } = await db.rpc("payment_online_confirm", {
    p_id: pid,
    p_method: "stripe",
    p_provider_payment_id: session.payment_intent ?? session.id,
    p_amount: (session.amount_total ?? 0) / 100,
    p_currency: (session.currency ?? "").toUpperCase(),
  });
  if (error) {
    console.error("Stripe confirm failed:", error.message);
    return "error";
  }
  return data as ConfirmResult;
}

// ---------------------------------------------------------------------
// SSLCommerz
// ---------------------------------------------------------------------

const sslBase = () => (env("SSLCOMMERZ_LIVE") === "true" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");

export async function sslcommerzStart(p: {
  paymentId: string;
  amount: number;
  currency: string;
  productName: string;
  customer: { name: string; email: string; phone: string | null };
  origin?: string | null;
}) {
  const storeId = env("SSLCOMMERZ_STORE_ID");
  const storePass = env("SSLCOMMERZ_STORE_PASSWORD");
  if (!storeId || !storePass) throw new Error("SSLCommerz is not set up.");
  const back = (r: string) => appUrl(`/api/payments/sslcommerz/return?pid=${p.paymentId}&r=${r}`, p.origin);
  const body = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePass,
    total_amount: p.amount.toFixed(2),
    currency: p.currency,
    tran_id: p.paymentId,
    success_url: back("success"),
    fail_url: back("fail"),
    cancel_url: back("cancel"),
    ipn_url: appUrl("/api/payments/sslcommerz/ipn", p.origin),
    product_name: p.productName,
    product_category: "Software subscription",
    product_profile: "non-physical-goods",
    shipping_method: "NO",
    num_of_item: "1",
    cus_name: p.customer.name || "FarmFlows customer",
    cus_email: p.customer.email,
    cus_phone: p.customer.phone || "01700000000",
    cus_add1: "Bangladesh",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    value_a: p.paymentId,
  });
  const res = await fetch(`${sslBase()}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => ({}))) as { status?: string; GatewayPageURL?: string; sessionkey?: string; failedreason?: string };
  if (json.status !== "SUCCESS" || !json.GatewayPageURL) throw new Error(json.failedreason || "SSLCommerz did not start the payment.");
  return { url: json.GatewayPageURL, sessionKey: json.sessionkey ?? null };
}

type SslValidation = {
  status?: string;
  tran_id?: string;
  val_id?: string;
  bank_tran_id?: string;
  amount?: string;
  currency?: string;
  currency_type?: string;
  currency_amount?: string;
  risk_level?: string;
};

/**
 * Asks SSLCommerz whether a val_id is a real, completed payment (never trust
 * what the browser posts back) and marks ours paid if the sum matches.
 */
export async function confirmSslcommerz(valId: string | null, expectedPid?: string | null): Promise<ConfirmResult> {
  if (!valId) return "missing";
  const storeId = env("SSLCOMMERZ_STORE_ID");
  const storePass = env("SSLCOMMERZ_STORE_PASSWORD");
  const db = serviceClient();
  if (!storeId || !storePass || !db) return "error";
  const url = new URL(`${sslBase()}/validator/api/validationserverAPI.php`);
  url.search = new URLSearchParams({ val_id: valId, store_id: storeId, store_passwd: storePass, format: "json", v: "1" }).toString();
  let v: SslValidation;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    v = (await res.json()) as SslValidation;
  } catch (e) {
    console.error("SSLCommerz validation failed:", e);
    return "error";
  }
  // INVALID_TRANSACTION (or anything else): not a payment we can accept.
  if (v.status !== "VALID" && v.status !== "VALIDATED") return "mismatch";
  if (!v.tran_id || (expectedPid && v.tran_id !== expectedPid)) return "mismatch";
  // High-risk payments are held by SSLCommerz: leave them for a super admin.
  if (v.risk_level === "1") return "unpaid";
  const { data, error } = await db.rpc("payment_online_confirm", {
    p_id: v.tran_id,
    p_method: "sslcommerz",
    p_provider_payment_id: v.bank_tran_id || v.val_id || valId,
    p_amount: Number(v.currency_amount ?? v.amount),
    p_currency: (v.currency_type ?? v.currency ?? "").toUpperCase(),
  });
  if (error) {
    console.error("SSLCommerz confirm failed:", error.message);
    return "error";
  }
  return data as ConfirmResult;
}

/** The payer gave up or the provider declined: the payment can be started again. */
export async function markOnlineFailed(paymentId: string, method: "stripe" | "sslcommerz") {
  const db = serviceClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(paymentId)) return;
  await db.rpc("payment_online_failed", { p_id: paymentId, p_method: method });
}

export async function setProviderRef(paymentId: string, ref: string) {
  await serviceClient()?.rpc("payment_online_set_ref", { p_id: paymentId, p_ref: ref });
}
