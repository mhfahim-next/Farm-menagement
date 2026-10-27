import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  className?: string;
}

/** A thin bar at the top that fills as the page is scrolled (pure CSS, see globals.css). */
export function ScrollProgress({ className }: ScrollProgressProps) {
  return (
    <div
      aria-hidden
      data-slot="scroll-progress"
      className={cn(
        "ff-scroll-progress fixed inset-x-0 top-0 z-[60] h-0.75 origin-left bg-gradient-to-r from-brand-from via-brand-via to-brand-to",
        className,
      )}
    />
  );
}
