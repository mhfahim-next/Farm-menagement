import Link from "next/link";

/**
 * FarmFlows logo (files in public/brand). The horizontal logo has a light and
 * a dark version; very narrow screens show only the app icon.
 */
export function Logo({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  const h = size === "lg" ? "h-10" : "h-8";
  return (
    <Link href={href} aria-label="FarmFlows" className="inline-flex shrink-0 items-center">
      {/* eslint-disable @next/next/no-img-element -- small static SVGs, no optimisation needed */}
      <img src="/brand/logo-horizontal.svg" alt="FarmFlows" width={252} height={64} className={`${h} w-auto dark:hidden max-[339px]:hidden`} />
      <img src="/brand/logo-horizontal-dark.svg" alt="FarmFlows" width={252} height={64} className={`${h} hidden w-auto dark:block max-[339px]:!hidden`} />
      <img src="/brand/icon.svg" alt="FarmFlows" width={64} height={64} className={`${h} hidden w-auto max-[339px]:block`} />
      {/* eslint-enable @next/next/no-img-element */}
    </Link>
  );
}
