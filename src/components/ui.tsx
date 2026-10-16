import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium sm:py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const buttonVariants = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-stone-700 hover:bg-stone-100",
};
export type ButtonVariant = keyof typeof buttonVariants;

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cx(buttonBase, buttonVariants[variant], className);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

const fieldClass =
  "w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 sm:py-2 sm:text-sm placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={3} className={cx(fieldClass, className)} {...props} />;
}

export function Select({
  options,
  className,
  ...props
}: ComponentProps<"select"> & {
  options: { value: string; label: string }[];
}) {
  return (
    <select className={cx(fieldClass, className)} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "min-w-0 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {title && <h2 className="font-semibold text-stone-900">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-sm text-stone-500">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-6">
      <div className="min-w-0">
        <h1 className="break-words text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p
        className={cx(
          "mt-1 text-xl font-bold tabular-nums sm:text-2xl",
          tone === "good" && "text-emerald-700",
          tone === "bad" && "text-red-600",
          tone === "default" && "text-stone-900",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
      <p className="font-medium text-stone-700">{title}</p>
      {children && <div className="mt-1 text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "green" | "amber" | "red" | "blue";
}) {
  const tones = {
    default: "bg-stone-100 text-stone-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-sky-100 text-sky-800",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/**
 * One row per record. On phones the table scrolls sideways when it is wider
 * than the screen, with its first column pinned (see .rtable in globals.css).
 */
export function Table({
  head,
  children,
}: {
  head: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="rtable -mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full text-left text-sm" style={{ "--cols": head.length } as CSSProperties}>
        <thead>
          <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-2 font-medium sm:px-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cx("px-4 py-2.5 text-stone-700 sm:px-5", className)}>{children}</td>;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx("h-4 w-4 animate-spin", className)} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Full-area loader shown by loading.tsx while a page's data is fetched. */
export function PageLoader({ label }: { label: string }) {
  return (
    <div role="status" data-testid="page-loader" className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-stone-500">
        <Spinner className="h-8 w-8 text-emerald-700" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
