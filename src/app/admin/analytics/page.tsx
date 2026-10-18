import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/charts/bar-chart";
import { BarList } from "@/components/charts/bar-list";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { UserGlobe } from "@/components/user-globe";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("analytics.title") };
}

type Analytics = {
  days: number;
  views: number;
  visitors: number;
  signups: number;
  active_users: number;
  logins: number;
  new_farms: number;
  daily: { day: string; views: number; visitors: number; signups: number }[];
  top_pages: { path: string; views: number }[];
  referrers: { referrer: string; views: number }[];
  countries: { country: string; views: number }[];
  devices: { device: string; views: number }[];
  locations: { lat: number; lng: number; city: string | null; country: string | null; users: number }[];
  recent_logins: {
    user_id: string;
    email: string | null;
    name: string | null;
    kind: "login" | "signup";
    ip: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    at: string;
  }[];
};

const RANGES = [7, 30, 90] as const;

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const { supabase } = await requireSuperAdmin();
  const { t, f, locale } = await getI18n();
  const sp = await searchParams;
  const days = RANGES.find((r) => String(r) === sp.days) ?? 30;

  const { data, error } = await supabase.rpc("admin_analytics", { p_days: days });
  if (error) throw new Error(error.message);
  const a = data as Analytics;

  const country = (code: string | null) => {
    if (!code || code === "??") return t("analytics.unknownPlace");
    try {
      return new Intl.DisplayNames([locale === "bn" ? "bn" : "en"], { type: "region" }).of(code) ?? code;
    } catch {
      return code;
    }
  };
  const short = (d: string) => f.date(d).replace(/,?\s*\d{4}$/, "").replace(/,?\s*[০-৯]{4}$/, "");
  const n = (v: number) => f.number(v);
  const markers = a.locations.map((l) => ({
    lat: l.lat,
    lng: l.lng,
    label: `${l.city ?? country(l.country)}${l.users > 1 ? ` (${f.number(l.users)})` : ""}`,
  }));
  const placeOf = (r: { city: string | null; region: string | null; country: string | null }) =>
    [r.city, r.region, r.country ? country(r.country) : null].filter(Boolean).join(", ") || t("analytics.unknownPlace");

  return (
    <>
      <PageHeader
        title={t("analytics.title")}
        description={t("analytics.desc")}
        action={
          <div role="tablist" aria-label={t("analytics.range")} className="inline-flex rounded-lg border border-stone-300 p-0.5 text-sm">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`?days=${r}`}
                role="tab"
                aria-selected={days === r}
                className={`rounded-md px-3 py-1.5 font-medium ${days === r ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}
              >
                {t("analytics.lastDays", { n: r })}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        <StatCard label={t("analytics.views")} value={n(a.views)} />
        <StatCard label={t("analytics.visitors")} value={n(a.visitors)} />
        <StatCard label={t("analytics.signups")} value={n(a.signups)} />
        <StatCard label={t("analytics.activeUsers")} value={n(a.active_users)} />
        <StatCard label={t("analytics.logins")} value={n(a.logins)} />
        <StatCard label={t("analytics.newFarms")} value={n(a.new_farms)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t("analytics.viewsPerDay")}>
          <BarChart
            title={t("analytics.viewsPerDay")}
            valueLabel={t("analytics.viewsUnit")}
            locale={locale}
            data={a.daily.map((d) => ({ key: d.day, label: short(d.day), value: d.views }))}
          />
        </Card>
        <Card title={t("analytics.signupsPerDay")}>
          <BarChart
            title={t("analytics.signupsPerDay")}
            valueLabel={t("analytics.signupsUnit")}
            locale={locale}
            data={a.daily.map((d) => ({ key: d.day, label: short(d.day), value: d.signups }))}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card title={t("analytics.whereUsers")} description={t("analytics.whereUsersDesc")}>
          <div className="grid place-items-center py-2">
            <UserGlobe markers={markers} label={t("analytics.globeLabel", { n: a.locations.length })} className="max-w-sm" />
          </div>
          {a.locations.length === 0 && <p className="mt-2 text-center text-sm text-stone-500">{t("analytics.noLocations")}</p>}
        </Card>
        <div className="grid content-start gap-6">
          <Card title={t("analytics.countries")}>
            <BarList
              empty={t("analytics.noData")}
              rows={a.countries.map((c) => ({ label: country(c.country), value: c.views, display: n(c.views) }))}
            />
          </Card>
          <Card title={t("analytics.devices")}>
            <BarList
              empty={t("analytics.noData")}
              rows={a.devices.map((d) => ({
                label: t(`analytics.device.${d.device as "mobile" | "tablet" | "desktop"}`),
                value: d.views,
                display: `${n(d.views)} · ${f.number(a.views ? (d.views / a.views) * 100 : 0)}%`,
              }))}
            />
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t("analytics.topPages")}>
          <BarList empty={t("analytics.noData")} rows={a.top_pages.map((p) => ({ label: p.path, value: p.views, display: n(p.views) }))} />
        </Card>
        <Card title={t("analytics.referrers")}>
          <BarList empty={t("analytics.noReferrers")} rows={a.referrers.map((r) => ({ label: r.referrer, value: r.views, display: n(r.views) }))} />
        </Card>
      </div>

      <Card className="mt-6" title={t("analytics.recentLogins")} description={t("analytics.recentLoginsDesc")}>
        {a.recent_logins.length === 0 ? (
          <EmptyState title={t("analytics.noData")} />
        ) : (
          <Table head={[t("admin.colUser"), t("analytics.colEvent"), t("analytics.colLocation"), t("analytics.colIp"), t("analytics.colTime")]}>
            {a.recent_logins.map((l, i) => (
              <tr key={`${l.user_id}-${l.at}-${i}`}>
                <Td>
                  <span className="block font-medium text-stone-900">{l.name ?? "—"}</span>
                  <span className="block text-xs text-stone-500">{l.email}</span>
                </Td>
                <Td>
                  <Badge tone={l.kind === "signup" ? "green" : "default"}>{t(`analytics.kind.${l.kind}`)}</Badge>
                </Td>
                <Td>{placeOf(l)}</Td>
                <Td className="font-mono text-xs">{l.ip ?? "—"}</Td>
                <Td className="whitespace-nowrap">{f.dateTime(l.at)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <p className="mt-4 text-xs text-stone-500">{t("analytics.privacyNote")}</p>
    </>
  );
}
