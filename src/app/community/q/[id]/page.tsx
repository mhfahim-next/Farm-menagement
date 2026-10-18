import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { AuthorLine, PlainText, PostImages, VetBadge } from "@/components/community/community-ui";
import { HelpfulButton } from "@/components/community/helpful-button";
import { CommunityImagePicker } from "@/components/community/image-picker";
import { OwnPostTools, ReportPost } from "@/components/community/post-tools";
import { ConfirmForm } from "@/components/confirm-form";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Badge, ButtonLink, Card, Field, Textarea } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { communityImageUrl, excerpt, postLang, type CommunityAnswer } from "@/lib/community";
import { getAuthors, getMyHelpful, getQuestion, getTopics } from "@/lib/community-data";
import { getI18n } from "@/lib/i18n/server";
import { langAlternates, SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { postAnswer, setBestAnswer } from "../../actions";

const UUID = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: PageProps<"/community/q/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return {};
  const data = await getQuestion(id);
  if (!data) return {};
  const { locale } = await getI18n();
  const { question: q, answers } = data;
  const live = answers.filter((a) => a.status === "published").length;
  return {
    title: q.title,
    description: excerpt(q.body),
    alternates: langAlternates(`/community/q/${q.id}`, locale),
    // Unanswered or unpublished questions are thin pages: keep them out of search until answered.
    robots: q.status !== "published" || live === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: q.title,
      description: excerpt(q.body),
      type: "article",
      url: `/community/q/${q.id}`,
      images: q.images[0] ? [communityImageUrl(q.images[0])] : undefined,
    },
  };
}

export default async function QuestionPage({ params }: PageProps<"/community/q/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const data = await getQuestion(id);
  if (!data) notFound();
  const { question: q } = data;
  const i18n = await getI18n();
  const { t, f, locale } = i18n;
  const user = await getUser();
  const supabase = await createClient();
  const [topics, { data: me }] = await Promise.all([
    getTopics(),
    user ? supabase.from("profiles").select("is_super_admin, community_banned").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const isAdmin = !!me?.is_super_admin;
  const canPost = !!user && !me?.community_banned;

  // Best answer first, then vets, then the most helpful, then oldest.
  const authors = await getAuthors([q.author_id, ...data.answers.map((a) => a.author_id)]);
  const answers = [...data.answers].sort(
    (a, b) =>
      Number(b.id === q.best_answer_id) - Number(a.id === q.best_answer_id) ||
      Number(!!authors.get(b.author_id)?.is_vet) - Number(!!authors.get(a.author_id)?.is_vet) ||
      b.helpful_count - a.helpful_count ||
      a.created_at.localeCompare(b.created_at),
  );
  const published = answers.filter((a) => a.status === "published");
  const mine = await getMyHelpful(user?.id, [q.id, ...answers.map((a) => a.id)]);
  const topic = topics.find((x) => x.id === q.topic_id);
  const topicName = topic ? (locale === "bn" ? topic.name_bn : topic.name_en) : null;
  const isAsker = user?.id === q.author_id;
  const url = `${SITE_URL}/community/q/${q.id}`;
  const mode = (authorId: string) => (!user ? "login" : user.id === authorId ? "own" : "vote") as "login" | "own" | "vote";

  const statusNote = (s: CommunityAnswer["status"]) =>
    s === "pending" ? <Badge tone="amber">{t("community.statusPending")}</Badge> : s === "hidden" ? <Badge tone="red">{t("community.statusHidden")}</Badge> : null;

  const answerLd = (a: CommunityAnswer) => ({
    "@type": "Answer",
    text: a.body,
    dateCreated: a.created_at,
    upvoteCount: a.helpful_count,
    url: `${url}#answer-${a.id}`,
    author: { "@type": "Person", name: authors.get(a.author_id)?.full_name ?? "FarmFlows member" },
  });
  const best = published.find((a) => a.id === q.best_answer_id);

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader />
      {q.status === "published" && published.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "QAPage",
            mainEntity: {
              "@type": "Question",
              name: q.title,
              text: q.body,
              answerCount: published.length,
              upvoteCount: q.helpful_count,
              dateCreated: q.created_at,
              author: { "@type": "Person", name: authors.get(q.author_id)?.full_name ?? "FarmFlows member" },
              ...(best ? { acceptedAnswer: answerLd(best) } : {}),
              suggestedAnswer: published.filter((a) => a.id !== best?.id).map(answerLd),
            },
          }}
        />
      )}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <nav aria-label={t("community.breadcrumb")} className="flex flex-wrap gap-1 text-sm text-stone-600">
          <Link href="/community" className="hover:text-stone-900">{t("community.title")}</Link>
          {topic && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/community?topic=${topic.slug}`} className="hover:text-stone-900">{topicName}</Link>
            </>
          )}
        </nav>

        <article className="mt-3">
          {q.status !== "published" && (
            <p role="status" className="mb-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              {q.status === "pending" ? t("community.pendingNotice") : t("community.hiddenNotice")}
            </p>
          )}
          <h1 lang={postLang(q.title)} className="break-words text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{q.title}</h1>
          <div className="mt-3">
            <AuthorLine author={authors.get(q.author_id)} date={q.created_at} i18n={i18n} />
          </div>
          <div className="mt-5">
            <PlainText text={q.body} />
            <PostImages images={q.images} alt={q.title} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-stone-200 pb-4">
            <HelpfulButton type="question" id={q.id} questionId={q.id} count={q.helpful_count} on={mine.has(q.id)} mode={mode(q.author_id)} />
            {user && !isAsker && q.status === "published" && <ReportPost target={{ type: "question", id: q.id, questionId: q.id }} />}
            {(isAsker || isAdmin) && (
              <OwnPostTools
                target={{ type: "question", id: q.id, questionId: q.id }}
                canEdit={isAsker}
                title={q.title}
                body={q.body}
                topicId={q.topic_id}
                topics={[{ value: "", label: t("community.pickTopic") }, ...topics.map((x) => ({ value: x.id, label: locale === "bn" ? x.name_bn : x.name_en }))]}
                afterDeleteHref="/community"
              />
            )}
          </div>
        </article>

        <section aria-labelledby="answers" className="mt-8">
          <h2 id="answers" className="text-xl font-bold text-stone-900">{t("community.answersCount", { n: f.number(published.length) })}</h2>
          {answers.length === 0 && <p className="mt-3 text-stone-600">{t("community.noAnswers")}</p>}
          <ol className="mt-4 grid gap-4">
            {answers.map((a) => {
              const author = authors.get(a.author_id);
              const isBest = a.id === q.best_answer_id;
              const isMine = user?.id === a.author_id;
              return (
                <li key={a.id} id={`answer-${a.id}`} className="scroll-mt-24">
                  <div className={`rounded-xl border p-4 sm:p-5 ${isBest ? "border-emerald-500 bg-emerald-50/50" : author?.is_vet ? "border-sky-300" : "border-stone-200"} bg-white`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <AuthorLine author={author} date={a.created_at} i18n={i18n} />
                      <span className="flex gap-2">
                        {isBest && <Badge tone="green">✓ {t("community.bestAnswer")}</Badge>}
                        {statusNote(a.status)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <PlainText text={a.body} />
                      <PostImages images={a.images} alt={t("community.answerPhoto")} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <HelpfulButton type="answer" id={a.id} questionId={q.id} count={a.helpful_count} on={mine.has(a.id)} mode={mode(a.author_id)} />
                      {(isAsker || isAdmin) && a.status === "published" && (
                        <ConfirmForm
                          action={setBestAnswer}
                          fields={{ question_id: q.id, answer_id: isBest ? "" : a.id }}
                          label={isBest ? t("community.unmarkBest") : t("community.markBest")}
                          variant="secondary"
                        />
                      )}
                      {user && !isMine && a.status === "published" && <ReportPost target={{ type: "answer", id: a.id, questionId: q.id }} />}
                      {(isMine || isAdmin) && (
                        <OwnPostTools target={{ type: "answer", id: a.id, questionId: q.id }} canEdit={isMine} body={a.body} />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="your-answer" className="mt-10">
          <h2 id="your-answer" className="text-lg font-bold text-stone-900">{t("community.yourAnswer")}</h2>
          {!user ? (
            <Card className="mt-3 text-center">
              <p className="text-stone-600">{t("community.loginToAnswer")}</p>
              <ButtonLink href={`/login?next=${encodeURIComponent(`/community/q/${q.id}`)}`} className="mt-3">{t("landing.login")}</ButtonLink>
            </Card>
          ) : !canPost ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{t("community.errBanned")}</p>
          ) : q.status !== "published" ? (
            <p className="mt-3 text-sm text-stone-600">{t("community.answersClosed")}</p>
          ) : (
            <Card className="mt-3">
              <ActionForm action={postAnswer} submitLabel={t("community.postAnswer")}>
                <input type="hidden" name="question_id" value={q.id} />
                <Field label={t("community.fieldAnswer")} hint={t("community.answerHint")}>
                  <Textarea name="body" rows={6} required minLength={2} maxLength={10000} />
                </Field>
                <CommunityImagePicker userId={user.id} />
              </ActionForm>
            </Card>
          )}
          <p className="mt-6 flex flex-col items-start gap-2 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-900 sm:flex-row">
            <VetBadge t={t} />
            <span>{t("community.vetNote")}</span>
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
