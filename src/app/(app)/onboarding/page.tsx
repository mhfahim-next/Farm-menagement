import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FarmForm } from "@/components/farm-form";
import { InviteList, type PendingInvite } from "@/components/invite-list";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getProfile, requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { getPlans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createFarm } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("onboarding.meta") };
}

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile?.account_type === "doctor") redirect("/doctor");
  const i18n = await getI18n();
  const { t } = i18n;
  const supabase = await createClient();
  const { count } = await supabase
    .from("farm_members")
    .select("farm_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (count) redirect("/dashboard");

  const { data: inviteRows } = await supabase.rpc("my_pending_invites");
  const invites = (inviteRows ?? []) as PendingInvite[];
  const sp = await searchParams;
  const wanted = typeof sp.plan === "string" ? sp.plan : null;
  const plan = wanted && (await getPlans()).some((p) => p.key === wanted && p.active) ? wanted : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-stone-50 px-4 py-12">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="mb-8">
        <Logo />
      </div>
      {invites.length > 0 && (
        <div className="mb-6 w-full max-w-lg">
          <h2 className="mb-2 text-sm font-semibold text-stone-700">{t("invites.title")}</h2>
          <InviteList invites={invites} i18n={i18n} />
        </div>
      )}
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
        <h1 className="text-xl font-bold">{t("onboarding.title")}</h1>
        <p className="mb-6 mt-1 text-sm text-stone-500">{t("onboarding.subtitle")}</p>
        <FarmForm action={createFarm} i18n={i18n} plan={plan} />
      </div>
    </div>
  );
}
