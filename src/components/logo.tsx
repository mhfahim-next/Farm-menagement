import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold text-stone-900">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 21V10l9-6 9 6v11" />
          <path d="M9 21v-6h6v6" />
        </svg>
      </span>
      FarmFlow
    </Link>
  );
}
