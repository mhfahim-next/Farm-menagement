"use client";

import { Button } from "@/components/ui";

/** Opens the browser's print dialog; "Save as PDF" is a destination there. */
export function PrintButton({ label, className }: { label: string; className?: string }) {
  return (
    <Button type="button" onClick={() => window.print()} className={className} data-testid="print">
      <span aria-hidden className="mr-2">🖨</span>
      {label}
    </Button>
  );
}
