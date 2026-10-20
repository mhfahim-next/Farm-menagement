"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ toast: (kind: ToastKind, message: string) => void }>({
  toast: () => {},
});

const LIFETIME_MS = 4500;

/** Small pop-ups for "saved / added / deleted" feedback. Mounted once in the root layout. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setItems((all) => [...all.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), LIFETIME_MS);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="print:hidden pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 safe-bottom px-4 pt-4 sm:items-end"
      >
        {items.map((it) => (
          <div
            key={it.id}
            role={it.kind === "error" ? "alert" : "status"}
            data-testid={`toast-${it.kind}`}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg ${
              it.kind === "error" ? "border-red-200" : "border-emerald-200"
            }`}
          >
            <span
              aria-hidden
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                it.kind === "error" ? "bg-red-600" : "bg-emerald-600"
              }`}
            >
              {it.kind === "error" ? "!" : "✓"}
            </span>
            <p className="min-w-0 flex-1 text-stone-800">{it.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(it.id)}
              className="-mr-1 shrink-0 rounded px-1 text-stone-400 hover:text-stone-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Fires a toast whenever a server action returns a new result. */
export function useResultToast(result: { success?: string; error?: string } | null | undefined, opts?: { errors?: boolean }) {
  const { toast } = useToast();
  const shown = useRef<unknown>(null);
  useEffect(() => {
    if (!result || shown.current === result) return;
    shown.current = result;
    if (result.success) toast("success", result.success);
    else if (result.error && opts?.errors) toast("error", result.error);
  }, [result, toast, opts?.errors]);
}
