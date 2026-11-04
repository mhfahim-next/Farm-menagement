"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile, MANAGERS, requireRole } from "@/lib/auth";
import { int, str } from "@/lib/form";
import type { MessageKey } from "@/lib/i18n/core";
import { getI18n } from "@/lib/i18n/server";
import { markOnlineFailed, providerReady, setProviderRef, sslcommerzStart, stripeCheckout } from "@/lib/payment-providers";
import { getPlans } from "@/lib/plans";
import type { ActionState } from "@/lib/types";

const ERRORS: Record<string, MessageKey> = {
  forbidden: "plan.requestOnlyOwner",
  off: "pay.err.off",
  method: "pay.err.method",
  plan: "pay.err.plan",
  period: "pay.err.period",
  price: "pay.err.plan",
  trx: "pay.err.trx",
  pending: "pay.err.pending",
  trx_used: "pay.err.trxUsed",
  done: "pay.err.done",
};

function payError(t: Awaited<ReturnType<typeof getI18n>>["t"], error: { message: string; code?: string }) {
  const code = /PAY:([a-z_]+)/.exec(error.message)?.[1];
  if (code && ERRORS[code]) return t(ERRORS[code]);
  // A unique index caught a double submit.
  if (error.code === "23505") return t(error.message.includes("trx") ? "pay.err.trxUsed" : "pay.err.pending");
  return t("common.errorGeneric");
}

function readForm(fd: FormData) {
  return {
    plan: str(fd, "plan") ?? "",
    months: int(fd, "months") ?? 0,
    currency: str(fd, "currency") === "USD" ? "USD" : "BDT",
    method: str(fd, "method") ?? "",
  };
}

/** bKash / Nagad / Rocket / Upay / bank: the farmer has sent the money and types the TrxID. */
export async function payManual(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const f = readForm(formData);
  const trx = (str(formData, "trx_id") ?? "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9-]{4,40}$/.test(trx)) return { error: t("pay.err.trx") };

  const { error } = await supabase.rpc("payment_create", {
    p_farm: farm.id,
    p_plan: f.plan,
    p_months: f.months,
    p_currency: f.currency,
    p_method: f.method,
    p_trx_id: trx,
  });
  if (error) return { error: payError(t, error) };
  revalidatePath("/dashboard/plan");
  return { success: t("pay.sent") };
}

/** Stripe / SSLCommerz: create the payment, then send the farmer to the provider's page. */
export async function payOnline(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, farm, user } = await requireRole(MANAGERS);
  const { t, locale } = await getI18n();
  const f = readForm(formData);

  const { data: method } = await supabase.from("payment_methods").select("key, kind").eq("key", f.method).eq("active", true).maybeSingle();
  if (!method || method.kind === "manual") return { error: t("pay.err.method") };
  if (!providerReady(method.kind)) return { error: t("pay.err.notReady") };

  const { data: id, error } = await supabase.rpc("payment_create", {
    p_farm: farm.id,
    p_plan: f.plan,
    p_months: f.months,
    p_currency: f.currency,
    p_method: f.method,
  });
  if (error || !id) return { error: error ? payError(t, error) : t("common.errorGeneric") };
  const paymentId = id as string;

  const { data: payment } = await supabase.from("payments").select("amount, currency").eq("id", paymentId).single();
  const plan = (await getPlans()).find((p) => p.key === f.plan);
  const productName = `FarmFlows ${plan?.name_en ?? f.plan} — ${f.months} ${f.months === 1 ? "month" : "months"} (${farm.name})`.slice(0, 120);
  const origin = (await headers()).get("origin");

  let url: string | null = null;
  try {
    if (method.kind === "stripe") {
      const session = await stripeCheckout({
        paymentId,
        amount: Number(payment?.amount),
        currency: payment?.currency ?? f.currency,
        productName,
        email: user.email ?? null,
        locale,
        origin,
      });
      await setProviderRef(paymentId, session.id);
      url = session.url;
    } else {
      const profile = await getProfile();
      const started = await sslcommerzStart({
        paymentId,
        amount: Number(payment?.amount),
        currency: payment?.currency ?? f.currency,
        productName,
        customer: { name: profile?.full_name ?? "", email: user.email ?? "noreply@farmflows.app", phone: profile?.phone ?? null },
        origin,
      });
      if (started.sessionKey) await setProviderRef(paymentId, started.sessionKey);
      url = started.url;
    }
  } catch (e) {
    console.error("Online payment start failed:", e);
  }
  if (!url) {
    await markOnlineFailed(paymentId, method.kind as "stripe" | "sslcommerz");
    return { error: t("pay.err.provider") };
  }
  redirect(url);
}

export async function cancelPayment(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireRole(MANAGERS);
  const { t } = await getI18n();
  const id = str(formData, "id");
  if (!id) return { error: t("common.errorGeneric") };
  const { error } = await supabase.rpc("payment_cancel", { p_id: id });
  if (error) return { error: payError(t, error) };
  revalidatePath("/dashboard/plan");
  return { success: t("pay.cancelled") };
}
