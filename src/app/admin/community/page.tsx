import type { Metadata } from "next";
import Link from "next/link";
import { PlainText } from "@/components/community/community-ui";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { excerpt, type CommunityAnswer, type CommunityQuestion } from "@/lib/community";
import { getI18n } from "@/lib/i18n/server";
import { banMember, moderatePost, setPremoderation } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.community.title") };
}

type Item = { type: "question" | "answer"; post: CommunityQuestion | CommunityAnswer; questionId: string; title: string };

export default async function AdminCommunityPage({ searchParams }: PageProps<"/admin/community">) {
  const { supabase } = await requireSuperAdmin();
  const { t, f } = await getI18n();
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "pending" || rawTab === "hidden" ? rawTab : "reported";

  const [{ data: settings }, { data: reports }, { data: questions }, { data: answers }, stats] = await Promise.all([
    supabase.from("system_settings").select("community_premoderation").eq("id", 1).maybeSingle(),
    supabase.from("community_reports").select("target_type, target_id, reason, note, created_at").eq("status", "open").order("created_at", { ascending: false }).limit(500),
    supabase.from("community_questions").select("*").neq("status", "published").order("created_at", { ascending: false }).limit(200),
    supabase.from("community_answers").select("*").neq("status", "published").order("created_at", { ascending: false }).limit(200),
    Promise.all([
      supabase.from("community_questions").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("community_answers").select("id", { count: "exact", head: true }).eq("status", "published"),
    ]),
  ]);

  // Posts with open reports (they may still be published, or already auto-hidden).
  const reportedIds = { question: new Set<string>(), answer: new Set<string>() };
  for (const r of reports ?? []) reportedIds[r.target_type as "question" | "answer"].add(r.target_id as string);
  const [{ data: rq }, { data: ra }] = await Promise.all([
    reportedIds.question.size ? supabase.from("community_questions").select("*").in("id", [...reportedIds.question]) : Promise.resolve({ data: [] }),
    reportedIds.answer.size ? supabase.from("community_answers").select("*").in("id", [...reportedIds.answer]) : Promise.resolve({ data: [] }),
  ]);
  const allAnswers = [...((answers ?? []) as CommunityAnswer[]), ...((ra ?? []) as CommunityAnswer[])];
  const parentIds = [...new Set(allAnswers.map((a) => a.question_id))];
  const { data: parents } = parentIds.length
    ? await supabase.from("community_questions").select("id, title").in("id", parentIds)
    : { data: [] };
  const titleOf = new Map((parents ?? []).map((p) => [p.id as string, p.title as string]));

  const asItems = (qs: CommunityQuestion[], as: CommunityAnswer[]): Item[] => [
    ...qs.map((p) => ({ type: "question" as const, post: p, questionId: p.id, title: p.title })),
    ...as.map((p) => ({ type: "answer" as const, post: p, questionId: p.question_id, title: titleOf.get(p.question_id) ?? "" })),
  ];
  const items =
    tab === "reported"
      ? asItems((rq ?? []) as CommunityQuestion[], (ra ?? []) as CommunityAnswer[])
      : asItems(
          ((questions ?? []) as CommunityQuestion[]).filter((q) => q.status === tab),
          ((answers ?? []) as CommunityAnswer[]).filter((a) => a.status === tab),
        );

  const authorIds = [...new Set(items.map((i) => i.post.author_id))];
  const { data: people } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name, community_banned").in("id", authorIds)
    : { data: [] };
  const person = new Map((people ?? []).map((p) => [p.id as string, p]));
  const reasonsFor = (type: string, id: string) =>
    (reports ?? []).filter((r) => r.target_type === type && r.target_id === id);
  const counts = {
    reported: reportedIds.question.size + reportedIds.answer.size,
    pending: [...(questions ?? []), ...(answers ?? [])].filter((p) => p.status === "pending").length,
    hidden: [...(questions ?? []), ...(answers ?? [])].filter((p) => p.status === "hidden").length,
  };
  const premod = !!settings?.community_premoderation;

  return (
    <>
      <PageHeader title={t("admin.community.title")} description={t("admin.community.desc")} />

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <Card>
          <p className="text-sm text-stone-600">
            {t("admin.community.stats", { q: f.number(stats[0].count ?? 0), a: f.number(stats[1].count ?? 0) })}
            {" · "}
            <Link href="/community" className="text-emerald-700 hover:underline">{t("admin.community.open")}</Link>
          </p>
        </Card>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">
              <span className="font-medium text-stone-900">{t("admin.community.premod")}: </span>
              <Badge tone={premod ? "amber" : "green"}>{premod ? t("admin.community.premodOn") : t("admin.community.premodOff")}</Badge>
            </span>
            <ConfirmForm
              action={setPremoderation}
              fields={{ value: String(!premod) }}
              label={premod ? t("admin.community.premodTurnOff") : t("admin.community.premodTurnOn")}
            />
          </div>
          <p className="mt-2 max-w-sm text-xs text-stone-500">{t("admin.community.premodHint")}</p>
        </Card>
      </div>

      <nav aria-label={t("admin.community.title")} className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 text-sm">
        {(["reported", "pending", "hidden"] as const).map((k) => (
          <Link
            key={k}
            href={k === "reported" ? "/admin/community" : `/admin/community?tab=${k}`}
            aria-current={k === tab ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-medium ${k === tab ? "bg-white text-emerald-800 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
          >
            {t(`admin.community.tab.${k}`)} ({f.number(counts[k])})
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <Card>
          <EmptyState title={t("admin.community.empty")} />
        </Card>
      ) : (
        <ul className="grid gap-4">
          {items.map(({ type, post, questionId, title }) => {
            const who = person.get(post.author_id);
            const reasons = reasonsFor(type, post.id);
            return (
              <li key={type + post.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge tone={type === "question" ? "blue" : "default"}>{t(`admin.community.type.${type}`)}</Badge>
                    <Badge tone={post.status === "published" ? "green" : post.status === "pending" ? "amber" : "red"}>
                      {t(`admin.community.status.${post.status}`)}
                    </Badge>
                    <span className="text-stone-600">
                      {who?.full_name ?? "—"} · {f.date(post.created_at)}
                    </span>
                    {who?.community_banned && <Badge tone="red">{t("admin.community.isBanned")}</Badge>}
                  </div>
                  <Link href={`/community/q/${questionId}${type === "answer" ? `#answer-${post.id}` : ""}`} className="mt-2 block font-semibold text-emerald-800 hover:underline">
                    {type === "answer" ? `↳ ${title}` : title}
                  </Link>
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-stone-50 p-3 text-sm">
                    <PlainText text={excerpt(post.body, 1200)} />
                  </div>
                  {reasons.length > 0 && (
                    <ul className="mt-2 grid gap-1 text-sm text-red-800">
                      {reasons.map((r, i) => (
                        <li key={i}>⚑ {t(`community.reason.${r.reason as "spam"}`)}{r.note ? `: ${r.note}` : ""}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.status !== "published" && (
                      <ConfirmForm action={moderatePost} fields={{ type, id: post.id, status: "published" }} label={t("admin.community.publish")} variant="primary" />
                    )}
                    {tab === "reported" && post.status === "published" && (
                      <ConfirmForm action={moderatePost} fields={{ type, id: post.id, status: "dismiss" }} label={t("admin.community.dismiss")} />
                    )}
                    {post.status !== "hidden" && (
                      <ConfirmForm action={moderatePost} fields={{ type, id: post.id, status: "hidden" }} label={t("admin.community.hide")} variant="danger" />
                    )}
                    <ConfirmForm
                      action={banMember}
                      fields={{ user_id: post.author_id, banned: String(!who?.community_banned) }}
                      confirm={who?.community_banned ? undefined : t("admin.community.confirmBan", { name: who?.full_name ?? "" })}
                      label={who?.community_banned ? t("admin.community.unban") : t("admin.community.ban")}
                      variant="ghost"
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
