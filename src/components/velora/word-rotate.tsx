"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface WordRotateProps {
  words: string[];
  /** Seconds each word is held */
  interval?: number;
  className?: string;
}

/**
 * Swaps a single word on a vertical roll (a CSS animation, see globals.css).
 * Quiet on purpose; stops on hover / focus and under reduced motion.
 */
export function WordRotate({ words, interval = 2.5, className }: WordRotateProps) {
  const [index, setIndex] = useState(0);
  // Held while hovered or focused so the word can be read (WCAG 2.2.2).
  const paused = useRef(false);

  useEffect(() => {
    if (words.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (paused.current || document.hidden) return;
      setIndex((i) => (i + 1) % words.length);
    }, interval * 1000);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  const pause = () => {
    paused.current = true;
  };
  const resume = () => {
    paused.current = false;
  };

  return (
    <span
      data-slot="word-rotate"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="inline-grid overflow-hidden align-bottom"
    >
      <span className="sr-only">{words.join(", ")}</span>
      <span key={index} aria-hidden className={cn("col-start-1 row-start-1", index > 0 && "ff-word-in", className)}>
        {words[index]}
      </span>
    </span>
  );
}
