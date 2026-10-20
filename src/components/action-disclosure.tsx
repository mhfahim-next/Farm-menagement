import type { ReactNode } from "react";

/**
 * A big, clearly clickable button that opens a form right below it
 * (a native <details>, so it works without JavaScript). The "+" turns into "−" when open.
 */
export function ActionDisclosure({
  label,
  children,
  open,
  tone = "primary",
  testId,
}: {
  label: string;
  children: ReactNode;
  open?: boolean;
  tone?: "primary" | "secondary";
  testId?: string;
}) {
  return (
    <details className="group mb-4" open={open}>
      <summary
        data-testid={testId}
        className={`inline-flex w-full cursor-pointer list-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-center text-sm font-semibold shadow-sm transition-colors [&::-webkit-details-marker]:hidden sm:w-auto ${
          tone === "primary"
            ? "bg-emerald-700 text-white hover:bg-emerald-800 group-open:bg-emerald-900"
            : "border border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-50"
        }`}
      >
        <span aria-hidden className="text-lg leading-none group-open:hidden">+</span>
        <span aria-hidden className="hidden text-lg leading-none group-open:inline">−</span>
        {label}
      </summary>
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">{children}</div>
    </details>
  );
}
