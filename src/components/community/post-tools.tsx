"use client";

import { deletePost, editPost, reportPost } from "@/app/community/actions";
import { REPORT_REASONS } from "@/lib/community";
import { ActionForm } from "../action-form";
import { ConfirmForm } from "../confirm-form";
import { useI18n } from "../i18n-provider";
import { Field, Input, Select, Textarea } from "../ui";

type Target = { type: "question" | "answer"; id: string; questionId: string };

/** Report form, folded inside a <details> so it costs nothing until opened. */
export function ReportPost({ target }: { target: Target }) {
  const { t } = useI18n();
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer list-none text-stone-500 hover:text-red-700">
        <span aria-hidden>⚑</span> {t("community.report")}
      </summary>
      <div className="mt-2 w-72 max-w-full rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
        <ActionForm action={reportPost} submitLabel={t("community.reportSend")} submitVariant="danger" className="grid gap-2">
          <input type="hidden" name="type" value={target.type} />
          <input type="hidden" name="id" value={target.id} />
          <input type="hidden" name="question_id" value={target.questionId} />
          <fieldset className="grid gap-1">
            <legend className="mb-1 text-sm font-medium text-stone-700">{t("community.reportWhy")}</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input type="radio" name="reason" value={r} required className="accent-emerald-700" />
                {t(`community.reason.${r}`)}
              </label>
            ))}
          </fieldset>
          <Input name="note" maxLength={500} placeholder={t("community.reportNote")} aria-label={t("community.reportNote")} />
        </ActionForm>
      </div>
    </details>
  );
}

/** Edit and delete for the author (delete also for super admins). */
export function OwnPostTools({
  target,
  canEdit,
  title,
  body,
  topicId,
  topics,
  afterDeleteHref,
}: {
  target: Target;
  canEdit: boolean;
  title?: string;
  body: string;
  topicId?: string | null;
  topics?: { value: string; label: string }[];
  afterDeleteHref?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-start gap-3 text-sm">
      {canEdit && (
        <details className="w-full">
          <summary className="cursor-pointer list-none text-stone-600 hover:text-emerald-800">✎ {t("common.edit")}</summary>
          <div className="mt-2">
            <ActionForm action={editPost} submitLabel={t("common.save")}>
              <input type="hidden" name="type" value={target.type} />
              <input type="hidden" name="id" value={target.id} />
              <input type="hidden" name="question_id" value={target.questionId} />
              {target.type === "question" && (
                <>
                  <Field label={t("community.fieldTitle")}>
                    <Input name="title" defaultValue={title} required minLength={10} maxLength={200} />
                  </Field>
                  {topics && (
                    <Field label={t("community.fieldTopic")}>
                      <Select name="topic_id" defaultValue={topicId ?? ""} options={topics} />
                    </Field>
                  )}
                </>
              )}
              <Field label={t("community.fieldBody")}>
                <Textarea name="body" defaultValue={body} rows={6} required maxLength={10000} />
              </Field>
            </ActionForm>
          </div>
        </details>
      )}
      <ConfirmForm
        action={deletePost}
        fields={{ type: target.type, id: target.id, question_id: target.questionId }}
        confirm={t(target.type === "question" ? "community.confirmDeleteQuestion" : "community.confirmDeleteAnswer")}
        label={t("common.delete")}
        variant="ghost"
        successHref={afterDeleteHref}
      />
    </div>
  );
}
