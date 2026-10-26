import type { Metadata } from "next";
import { Badge, Card, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { emailReady, pushReady } from "@/lib/notify";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("adminrem.title") };
}

type Stats = {
  push_users: number;
  push_devices: number;
  email_users: number;
  muted_users: number;
  days: { day: string; push: number; email: number; failed: number }[];
};

export default async function AdminRemindersPage() {
  const { supabase } = await requireSuperAdmin();
  const { t, f } = await getI18n();
  const { data } = await supabase.rpc("admin_reminder_stats");
  const s = (data ?? { push_users: 0, push_devices: 0, email_users: 0, muted_users: 0, days: [] }) as Stats;

  // Which server settings are in place (values are never shown).
  const setup = [
    { name: "CRON_SECRET", ok: Boolean(process.env.CRON_SECRET?.trim()) },
    { name: "SUPABASE_SERVICE_ROLE_KEY", ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) },
    { name: "VAPID keys (phone)", ok: pushReady() },
    { name: "RESEND_API_KEY (email)", ok: emailReady() },
  ];

  return (
    <>
      <PageHeader title={t("adminrem.title")} description={t("adminrem.desc")} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t("adminrem.pushUsers")} value={f.number(s.push_users)} hint={t("adminrem.pushDevices", { n: s.push_devices })} />
        <StatCard label={t("adminrem.emailUsers")} value={f.number(s.email_users)} />
        <StatCard label={t("adminrem.mutedUsers")} value={f.number(s.muted_users)} />
        <StatCard
          label={t("adminrem.failed")}
          value={f.number(s.days.reduce((n, d) => n + d.failed, 0))}
          tone={s.days.some((d) => d.failed > 0) ? "bad" : "default"}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          {s.days.length === 0 ? (
            <p className="text-sm text-stone-500">{t("adminrem.none")}</p>
          ) : (
            <Table head={[t("adminrem.day"), t("adminrem.push"), t("adminrem.email"), t("adminrem.failed")]}>
              {s.days.map((d) => (
                <tr key={d.day}>
                  <Td>{f.date(d.day)}</Td>
                  <Td className="tabular-nums">{f.number(d.push)}</Td>
                  <Td className="tabular-nums">{f.number(d.email)}</Td>
                  <Td className={`tabular-nums ${d.failed ? "text-red-600" : ""}`}>{f.number(d.failed)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card title={t("adminrem.setup")}>
          <ul className="grid gap-2 text-sm" data-testid="reminder-setup">
            {setup.map((x) => (
              <li key={x.name} className="flex items-center justify-between gap-2">
                <code className="text-xs">{x.name}</code>
                <Badge tone={x.ok ? "green" : "amber"}>{x.ok ? t("adminrem.ready") : t("adminrem.missing")}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
