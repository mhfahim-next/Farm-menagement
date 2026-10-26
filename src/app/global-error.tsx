"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/** Last-resort page when even the main layout fails (no translations available here). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html lang="bn">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fafaf9", color: "#1c1917", margin: 0 }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "64px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 48, margin: 0 }} aria-hidden>
            🐄💤
          </p>
          <h1 style={{ fontSize: 24, margin: "20px 0 8px" }}>কিছু একটা ভুল হয়েছে · Something went wrong</h1>
          <p style={{ color: "#57534e" }}>আবার চেষ্টা করুন। সমস্যা থাকলে কিছুক্ষণ পরে আসুন। · Please try again in a moment.</p>
          {error.digest && <p style={{ color: "#a8a29e", fontSize: 12 }}>{error.digest}</p>}
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 24, padding: "10px 20px", borderRadius: 8, border: 0, background: "#047857", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            আবার চেষ্টা · Try again
          </button>
        </main>
      </body>
    </html>
  );
}
