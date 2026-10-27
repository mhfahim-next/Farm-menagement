import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds of stagger (moves the start of the reveal a little further into the scroll) */
  delay?: number;
  /** Kept for compatibility; the reveal length is set by the scroll position. */
  duration?: number;
  /** Direction the element enters from */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance travelled in px */
  offset?: number;
  /** Kept for compatibility (the reveal always plays once per scroll into view). */
  once?: boolean;
  inView?: boolean;
}

const MOVE = {
  up: (o: number) => `0 ${o}px`,
  down: (o: number) => `0 ${-o}px`,
  left: (o: number) => `${o}px 0`,
  right: (o: number) => `${-o}px 0`,
  none: () => "0 0",
};

/**
 * Fades and un-blurs its children in as they scroll into view.
 *
 * Pure CSS (a scroll-driven animation, see globals.css): no JavaScript, and
 * content is never hidden waiting for scripts. Browsers without scroll-driven
 * animations (and people who prefer reduced motion) just see the content.
 */
export function BlurFade({ children, className, delay = 0, direction = "up", offset = 16 }: BlurFadeProps) {
  const style = {
    "--bf-move": MOVE[direction](offset),
    "--bf-start": `${Math.min(30, Math.round(delay * 100))}%`,
  } as CSSProperties;
  return (
    <div data-slot="blur-fade" className={cn("ff-blur-fade", className)} style={style}>
      {children}
    </div>
  );
}
