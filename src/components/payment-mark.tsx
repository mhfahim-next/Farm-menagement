import { styleOf } from "@/lib/payments";

/** A payment method's badge in its own brand colours (bKash pink, Nagad orange, …). */
export function PaymentMark({ method, size = "md", locale }: { method: string; size?: "sm" | "md" | "lg"; locale?: string }) {
  const s = styleOf(method);
  const box = size === "sm" ? "h-6 min-w-14 px-2 text-[11px]" : size === "lg" ? "h-12 min-w-28 px-4 text-lg" : "h-9 min-w-20 px-3 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-extrabold tracking-tight shadow-sm ${box}`}
      style={{ background: s.bg, color: s.fg }}
      aria-hidden
    >
      {locale === "bn" && s.wordBn ? s.wordBn : s.word}
    </span>
  );
}
