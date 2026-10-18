"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleHelpful } from "@/app/community/actions";
import { useI18n } from "../i18n-provider";
import { useToast } from "../toast";

/** "Helpful" mark with a count. Visitors are sent to log in; authors can't mark their own posts. */
export function HelpfulButton({
  type,
  id,
  questionId,
  count,
  on,
  mode,
}: {
  type: "question" | "answer";
  id: string;
  questionId: string;
  count: number;
  on: boolean;
  mode: "vote" | "own" | "login";
}) {
  const { t, f } = useI18n();
  const { toast } = useToast();
  const [state, setState] = useState({ on, count });
  const [pending, start] = useTransition();
  const label = `${t("community.helpful")} · ${f.number(state.count)}`;
  const cls = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition ${
    state.on ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-stone-300 text-stone-700 hover:border-emerald-600"
  }`;

  if (mode === "login") {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/community/q/${questionId}`)}`} className={cls}>
        <span aria-hidden>👍</span> {label}
      </Link>
    );
  }
  if (mode === "own") {
    return (
      <span className={cls} title={t("community.errOwnPost")}>
        <span aria-hidden>👍</span> {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={state.on}
      disabled={pending}
      className={cls}
      onClick={() => {
        const next = { on: !state.on, count: state.count + (state.on ? -1 : 1) };
        setState(next);
        start(async () => {
          const r = await toggleHelpful(type, id, questionId);
          if ("error" in r && r.error) {
            setState(state);
            toast("error", r.error);
          }
        });
      }}
    >
      <span aria-hidden>👍</span> {label}
    </button>
  );
}
