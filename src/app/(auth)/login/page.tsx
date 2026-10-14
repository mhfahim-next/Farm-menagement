import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field, Input } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { login } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("auth.loginMeta") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const { t } = await getI18n();

  return (
    <>
      <h1 className="text-xl font-bold">{t("auth.loginTitle")}</h1>
      <p className="mb-6 mt-1 text-sm text-stone-500">{t("auth.loginSubtitle")}</p>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{t("auth.linkInvalid")}</p>
      )}
      <ActionForm action={login} submitLabel={t("auth.loginSubmit")} fullWidthSubmit>
        <input type="hidden" name="next" value={typeof next === "string" ? next : ""} />
        <Field label={t("common.email")}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t("common.password")}>
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-stone-500">
        {t("auth.newHere")}{" "}
        <Link href="/signup" className="font-medium text-emerald-700 hover:underline">
          {t("auth.createAccountLink")}
        </Link>
      </p>
    </>
  );
}
