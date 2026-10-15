import type { Metadata } from "next";
import Link from "next/link";
import { InviteList, type PendingInvite } from "@/components/invite-list";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { EmptyState } from "@/components/ui";
import { getProfile, requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("invites.meta") };
}

export default async function InvitesPage() {
  await requireUser();
  const profile = await getProfile();
  const i18n = await getI18n();
  const { t } = i18n;
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_pending_invites");
  const invites = (data ?? []) as PendingInvite[];
  const back = profile?.account_type === "doctor" ? "/doctor" : "/dashboard";

  return (
    <div className="flex flex-1 flex-col items-center bg-gradient-to-b from-emerald-50 to-stone-50 px-4 py-12">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="mb-8">
        <Logo href={back} />
      </div>
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold tracking-tight">{t("invites.title")}</h1>
        <p className="mb-6 mt-1 text-stone-500">{t("invites.desc")}</p>
        {invites.length === 0 ? <EmptyState title={t("invites.empty")} /> : <InviteList invites={invites} i18n={i18n} />}
        <p className="mt-6 text-sm">
          <Link href={back} className="text-emerald-700 hover:underline">
            ← {t("menu.backToApp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
