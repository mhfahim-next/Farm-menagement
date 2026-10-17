"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { askAssistant, confirmProposal } from "@/app/dashboard/assistant/actions";
import type { ChatTurn, Proposal } from "@/lib/ai/types";
import { useI18n } from "./i18n-provider";
import { useToast } from "./toast";
import { Button, Spinner } from "./ui";
import { DotsLoader } from "./velora/loaders";
import { TextShimmer } from "./velora/text-shimmer";

type PState = Proposal & { state: "pending" | "saving" | "saved" | "cancelled" };
type Msg = { id: number; role: "user" | "assistant"; text: string; error?: boolean; note?: boolean; proposals?: PState[] };
type Status = { used: number; max: number | null };

// Minimal typing for the browser's speech recognition (not in lib.dom everywhere).
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

/** Floating chat: farmers say what happened, confirm the prepared record, and it is saved. */
export function AiAssistant({ initial }: { initial: Status }) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(initial);
  const [listening, setListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const recog = useRef<Recognition | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  const limitReached = status.max !== null && status.used >= status.max;
  const left = status.max === null ? null : Math.max(0, status.max - status.used);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability, known only after mount
    setCanSpeak(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const add = useCallback((m: Omit<Msg, "id">) => {
    const id = nextId.current++;
    setMsgs((all) => [...all, { ...m, id }]);
    return id;
  }, []);

  function stopListening() {
    recog.current?.stop();
    setListening(false);
  }

  function toggleMic() {
    if (listening) return stopListening();
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = locale === "bn" ? "bn-BD" : "en-US";
    r.interimResults = true;
    r.continuous = false;
    const base = input ? input.trimEnd() + " " : "";
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setInput(base + text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recog.current = r;
    setListening(true);
    r.start();
  }

  async function send(text = input) {
    const message = text.trim();
    if (!message || busy || limitReached) return;
    if (listening) stopListening();
    const history: ChatTurn[] = msgs.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    add({ role: "user", text: message });
    setInput("");
    setBusy(true);
    try {
      const res = await askAssistant(history, message);
      if (res.status) setStatus(res.status);
      if (res.error) add({ role: "assistant", text: res.error, error: true });
      else add({ role: "assistant", text: res.reply ?? "", proposals: (res.proposals ?? []).map((p) => ({ ...p, state: "pending" as const })) });
    } catch {
      add({ role: "assistant", text: t("ai.err.failed"), error: true });
    } finally {
      setBusy(false);
    }
  }

  function patch(msgId: number, pId: string, state: PState["state"]) {
    setMsgs((all) => all.map((m) => (m.id === msgId ? { ...m, proposals: m.proposals?.map((p) => (p.id === pId ? { ...p, state } : p)) } : m)));
  }

  async function confirm(msgId: number, p: PState) {
    patch(msgId, p.id, "saving");
    const res = await confirmProposal(p.kind, p.fields);
    if (res?.error) {
      toast("error", res.error);
      patch(msgId, p.id, "pending");
      return;
    }
    toast("success", res?.success ?? t("ai.saved"));
    patch(msgId, p.id, "saved");
    add({ role: "assistant", text: t("ai.savedNote", { title: p.title }), note: true });
    router.refresh();
  }

  function cancel(msgId: number, p: PState) {
    patch(msgId, p.id, "cancelled");
    add({ role: "assistant", text: t("ai.cancelledNote", { title: p.title }), note: true });
  }

  const examples = [t("ai.ex1"), t("ai.ex2"), t("ai.ex3"), t("ai.ex4")];

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("ai.open")}
          data-testid="ai-open"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-800 safe-bottom-fab"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" />
          </svg>
          <span className="max-sm:hidden">{t("ai.title")}</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={t("ai.title")}
          data-testid="ai-panel"
          className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[36rem] sm:max-h-[calc(100vh-2rem)] sm:w-[26rem] sm:rounded-2xl sm:border sm:border-stone-200 sm:shadow-2xl"
        >
          <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-stone-900">{t("ai.title")}</h2>
              <p data-testid="ai-left" className={`text-xs ${limitReached ? "text-red-600" : "text-stone-500"}`}>
                {left === null ? t("ai.unlimited") : t("ai.left", { left, max: status.max! })}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("ai.close")} className="grid h-9 w-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.length === 0 && (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-stone-700">
                <p>{t("ai.intro")}</p>
                <p className="mt-3 text-xs font-medium text-stone-500">{t("ai.try")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {examples.map((ex) => (
                    <button key={ex} type="button" disabled={limitReached} onClick={() => setInput(ex)} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-left text-xs text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m) =>
              m.note ? (
                <p key={m.id} className="text-center text-xs text-stone-500">{m.text}</p>
              ) : (
                <div key={m.id} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  {m.text && (
                    <p
                      data-testid={m.role === "user" ? "ai-user" : m.error ? "ai-error" : "ai-reply"}
                      className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                        m.role === "user" ? "bg-emerald-700 text-white" : m.error ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-800"
                      }`}
                    >
                      {m.text}
                    </p>
                  )}
                  {m.proposals?.map((p) => (
                    <div key={p.id} data-testid="ai-proposal" className="w-full max-w-[94%] rounded-xl border border-stone-200 bg-white p-3 text-sm shadow-sm">
                      <p className="font-medium text-stone-900">{p.title}</p>
                      <ul className="mt-1.5 space-y-0.5 text-stone-600">
                        {p.lines.filter(Boolean).map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                      {p.state === "saved" ? (
                        <p className="mt-2 text-xs font-medium text-emerald-700">✓ {t("ai.saved")}</p>
                      ) : p.state === "cancelled" ? (
                        <p className="mt-2 text-xs text-stone-500">{t("ai.cancelled")}</p>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <Button type="button" className="px-3 py-1.5" disabled={p.state === "saving"} onClick={() => confirm(m.id, p)} data-testid="ai-confirm">
                            {p.state === "saving" && <Spinner />}
                            {t("ai.confirm")}
                          </Button>
                          <Button type="button" variant="secondary" className="px-3 py-1.5" disabled={p.state === "saving"} onClick={() => cancel(m.id, p)}>
                            {t("ai.cancel")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ),
            )}

            {busy && (
              <p className="flex items-center gap-2 text-sm">
                <DotsLoader size="sm" label={t("ai.thinking")} className="text-emerald-600" />
                <TextShimmer>{t("ai.thinking")}</TextShimmer>
              </p>
            )}
            <div ref={bottom} />
          </div>

          {limitReached ? (
            <div data-testid="ai-limit" className="border-t border-stone-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 safe-bottom">
              <p className="font-semibold">{t("ai.limitTitle")}</p>
              <p className="mt-0.5">{t("ai.limitBody", { max: status.max! })}</p>
              <Link href="/dashboard/plan" className="mt-2 inline-block font-medium underline">
                {t("ai.upgrade")}
              </Link>
            </div>
          ) : (
            <form
              className="flex items-end gap-2 border-t border-stone-200 px-3 py-3 safe-bottom"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                maxLength={1000}
                placeholder={listening ? t("ai.listening") : t("ai.placeholder")}
                aria-label={t("ai.placeholder")}
                data-testid="ai-input"
                className="min-w-0 flex-1 resize-none rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 sm:text-sm"
              />
              {canSpeak && (
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-label={listening ? t("ai.micStop") : t("ai.mic")}
                  aria-pressed={listening}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${listening ? "border-red-300 bg-red-50 text-red-600" : "border-stone-300 text-stone-700 hover:bg-stone-50"}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                  </svg>
                </button>
              )}
              <Button type="submit" disabled={busy || !input.trim()} className="h-11 shrink-0" data-testid="ai-send">
                {t("ai.send")}
              </Button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
