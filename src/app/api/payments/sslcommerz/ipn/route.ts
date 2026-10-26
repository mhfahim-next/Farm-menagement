import { NextResponse } from "next/server";
import { confirmSslcommerz } from "@/lib/payment-providers";

/** SSLCommerz's server-to-server notice (IPN): confirms a payment even if the payer closed the browser. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const valId = (form?.get("val_id") as string | null) ?? null;
  const status = form?.get("status");
  if (status !== "VALID" && status !== "VALIDATED") return NextResponse.json({ received: true });
  const result = await confirmSslcommerz(valId, (form?.get("tran_id") as string | null) ?? null);
  if (result === "error") return NextResponse.json({ error: "retry" }, { status: 500 });
  return NextResponse.json({ received: true, result });
}
