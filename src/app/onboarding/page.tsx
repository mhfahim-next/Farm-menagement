import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Field, Input, Select } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { createFarm } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("onboarding.meta") };
}

export default async function OnboardingPage() {
  const user = await requireUser();
  const { t } = await getI18n();
  const supabase = await createClient();
  const { count } = await supabase
    .from("farm_members")
    .select("farm_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (count) redirect("/dashboard");

  const currencies = (["BDT", "INR", "PKR", "USD", "EUR"] as const).map((c) => ({
    value: c,
    label: t(`currency.${c}`),
  }));

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-stone-50 px-4 py-12">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
        <h1 className="text-xl font-bold">{t("onboarding.title")}</h1>
        <p className="mb-6 mt-1 text-sm text-stone-500">{t("onboarding.subtitle")}</p>
        <ActionForm action={createFarm} submitLabel={t("onboarding.submit")} fullWidthSubmit>
          <Field label={t("onboarding.farmName")}>
            <Input name="name" placeholder={t("onboarding.farmNamePlaceholder")} required minLength={2} />
          </Field>
          <Field label={t("common.location")}>
            <Input name="location" placeholder={t("onboarding.locationPlaceholder")} />
          </Field>
          <Field label={t("common.currency")}>
            <Select name="currency" defaultValue="BDT" options={currencies} />
          </Field>
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-sm font-medium text-stone-700">
              {t("onboarding.farmTypeLegend")}
            </legend>
            <ModuleOption name="has_dairy" title={t("onboarding.dairyTitle")} body={t("onboarding.dairyBody")} />
            <ModuleOption name="has_layer" title={t("onboarding.layerTitle")} body={t("onboarding.layerBody")} />
          </fieldset>
        </ActionForm>
      </div>
    </div>
  );
}

function ModuleOption({ name, title, body }: { name: string; title: string; body: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50">
      <input type="checkbox" name={name} defaultChecked className="mt-1 accent-emerald-700" />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-stone-500">{body}</span>
      </span>
    </label>
  );
}
