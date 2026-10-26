import { NextResponse, type NextRequest } from "next/server";
import { confirmSslcommerz, markOnlineFailed } from "@/lib/payment-providers";

/**
 * SSLCommerz posts the payer's browser back here (success, fail or cancel).
 * A success is only believed after SSLCommerz's validation API agrees.
 */
async function handle(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const pid = sp.get("pid") ?? "";
  let valId = sp.get("val_id");
  if (request.method === "POST") {
    const form = await request.formData().catch(() => null);
    valId = (form?.get("val_id") as string | null) ?? valId;
  }
  // 303 turns the provider's POST into a normal page visit (with the user's cookies).
  const back = (result: string) => NextResponse.redirect(new URL(`/dashboard/plan?pay=${result}`, request.url), 303);

  const r = sp.get("r");
  if (r !== "success") {
    await markOnlineFailed(pid, "sslcommerz");
    return back(r === "cancel" ? "cancelled" : "failed");
  }
  const result = await confirmSslcommerz(valId, pid);
  return back(result === "paid" || result === "already" ? "paid" : result === "unpaid" ? "processing" : "failed");
}

export const GET = handle;
export const POST = handle;
