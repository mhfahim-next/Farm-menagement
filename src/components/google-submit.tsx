"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, Spinner } from "./ui";

/** Submit button that shows a spinner while the browser is sent to Google. */
export function GoogleSubmit({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} className="w-full gap-3 py-2.5">
      {pending && <Spinner />}
      {children}
    </Button>
  );
}
