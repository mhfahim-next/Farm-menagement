"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "../i18n-provider";
import { useViewer } from "../viewer";

type Q = { title: string; body: string; status: string };

/**
 * A question that isn't public (waiting for review or hidden). The cached page
 * can't show it, so its author — or an admin — gets it from the database in
 * the browser; everyone else sees "not found".
 */
export function PendingQuestion({ id }: { id: string }) {
  const { t } = useI18n();
  const viewer = useViewer();
  const [q, setQ] = useState<Q | null | undefined>(undefined);
  useEffect(() => {
    if (!viewer) return;
    createClient()
      .from("community_questions")
      .select("title, body, status")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setQ((data as Q | null) ?? null));
  }, [viewer, id]);
  // Visitors can't see unpublished questions: "not found" straight away.
  const shown = viewer === null ? null : q;
  if (shown === undefined) return <p className="text-stone-500">…</p>;
  if (shown === null)
    return (
      <div className="text-center" data-testid="question-missing">
        <h1 className="text-2xl font-bold text-stone-900">{t("notFound.title")}</h1>
        <p className="mt-3 text-stone-600">{t("notFound.body")}</p>
      </div>
    );
  return (
    <article data-testid="question-pending">
      <p role="status" className="mb-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
        {shown.status === "pending" ? t("community.pendingNotice") : t("community.hiddenNotice")}
      </p>
      <h1 className="break-words text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{shown.title}</h1>
      <div className="mt-5 grid gap-3 whitespace-pre-line break-words leading-7 text-stone-800">{shown.body}</div>
    </article>
  );
}
