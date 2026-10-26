import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/charts/bar-chart";
import { BarList } from "@/components/charts/bar-list";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td } from "@/components/ui";
import { UserGlobe } from "@/components/user-globe";
import { requireSuperAdmin } from "@/lib/auth";
import { planName } from "@/lib/plan-utils";
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

type Growth = {
  days: number;
  cur: Record<"views" | "visitors" | "signups" | "active_users" | "logins" | "new_farms", number>;
  prev: Record<"views" | "visitors" | "signups" | "active_users" | "logins" | "new_farms", number>;
  totals: { users: number; farms: number; cattle: number; flocks: number };
  monthly: { month: string; users: number; farms: number; active_farms: number }[];
  funnel: { visitors: number; signups: number; farms: number; animals: number; records: number };
  activation: { eligible: number; activated: number };
  retention: Record<"d1" | "d7" | "d30", { eligible: number; returned: number }>;
  inactive_farms: { farm_id: string; name: string; plan: string; created_at: string; email: string | null; owner: string | null; phone: string | null; last_activity: string | null }[];
};
type Usage = {
  total_farms: number;
  features: { key: string; count: number; rows: number }[];
  pages: { key: string; count: number; rows: number }[];
  ai: { prompts: number; farms: number; input_tokens: number; output_tokens: number; by_plan: { plan: string; prompts: number; farms: number }[] };
};
type Sources = {
  visitors: number;
  signups: number;
  attributed_signups: number;
  sources: { source: string; visitors: number; signups: number }[];
  campaigns: { campaign: string; visitors: number; signups: number }[];
  landing: { path: string; signups: number }[];
  locales: { locale: string; views: number }[];
  visitor_kinds: { new: number; returning: number };
  top_cities: { city: string; country: string | null; users: number }[];
  blog: { path: string; views: number; visitors: number }[];
};
type Business = {
  plans: { key: string; name_en: string; name_bn: string | null; price: number | null; farms: number }[];
  requests: Record<"upgrade_open" | "upgrade_approved" | "upgrade_rejected" | "support_open" | "support_resolved", number> & { avg_hours_to_resolve: number | null };
  near_limit: { farm_id: string; name: string; plan: string; email: string | null; max_cattle: number | null; max_flocks: number | null; cattle: number; flocks: number; pct: number }[];
  support: Record<"requests_open" | "messages_new" | "reviews_pending" | "reports_open" | "posts_waiting", number>;
  community: { questions: number; answers: number; unanswered: number; members_posting: number };
};

const RANGES = [7, 30, 90] as const;
const TABS = ["overview", "growth", "features", "traffic", "business"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const { supabase } = await requireSuperAdmin();
  const { t, f, locale } = await getI18n();
  const sp = await searchParams;
  const days = RANGES.find((r) => String(r) === sp.days) ?? 30;
  const tab: Tab = TABS.find((x) => x === sp.tab) ?? "overview";

  const call = async <T,>(fn: string) => {
    const { data, error } = await supabase.rpc(fn, { p_days: days });
    if (error) throw new Error(error.message);
    return data as T;
  };
  const [a, g, usage, src, biz] = await Promise.all([
    tab === "overview" ? call<Analytics>("admin_analytics") : Promise.resolve(null),
    tab === "overview" || tab === "growth" ? call<Growth>("admin_analytics_growth") : Promise.resolve(null),
    tab === "features" ? call<Usage>("admin_analytics_usage") : Promise.resolve(null),
    tab === "traffic" ? call<Sources>("admin_analytics_sources") : Promise.resolve(null),
    tab === "business" ? call<Business>("admin_analytics_business") : Promise.resolve(null),
  ]);

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
  const pct = (part: number, whole: number) => (whole > 0 ? `${f.number((part / whole) * 100, 1)}%` : "—");
  /** Change against the period before: arrow and percentage, or "new". */
  const delta = (cur: number, prev: number): { text: string; tone: "good" | "bad" | "default" } | null => {
    if (cur === prev) return { text: t("analytics.noChange", { n: days }), tone: "default" };
    if (prev === 0) return { text: `↑ ${t("analytics.vsPrevNew", { n: days })}`, tone: "good" };
    const change = ((cur - prev) / prev) * 100;
    const text = `${change > 0 ? "↑" : "↓"} ${t("analytics.vsPrev", { pct: `${f.number(Math.abs(change), 0)}%`, n: days })}`;
    return { text, tone: change > 0 ? "good" : "bad" };
  };
  const markers = (a?.locations ?? []).map((l) => ({
    lat: l.lat,
    lng: l.lng,
    label: `${l.city ?? country(l.country)}${l.users > 1 ? ` (${f.number(l.users)})` : ""}`,
  }));
  const placeOf = (r: { city: string | null; region: string | null; country: string | null }) =>
    [r.city, r.region, r.country ? country(r.country) : null].filter(Boolean).join(", ") || t("analytics.unknownPlace");
  const sourceLabel = (s: string) => (s === "direct" ? t("analytics.source.direct") : s);
  const exportHref = (kind: string) => `/admin/analytics/export?kind=${kind}&days=${days}`;
  const exportLink = (kind: string) => (
    <a href={exportHref(kind)} className="text-sm font-medium text-emerald-700 hover:underline" data-testid={`export-${kind}`}>
      ⬇ {t("analytics.exportCsv")}
    </a>
  );
  const fmtDate = (d: string | null) => (d ? f.date(d) : t("analytics.never"));

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
                href={`?tab=${tab}&days=${r}`}
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

      <nav aria-label={t("analytics.title")} className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((x) => (
          <Link
            key={x}
            href={`?tab=${x}&days=${days}`}
            aria-current={tab === x ? "page" : undefined}
            data-testid={`tab-${x}`}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium ${tab === x ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 text-stone-600 hover:bg-stone-100"}`}
          >
            {t(`analytics.tab.${x}`)}
          </Link>
        ))}
      </nav>

      {tab === "overview" && a && g && (
        <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        {(["views", "visitors", "signups", "active_users", "logins", "new_farms"] as const).map((k) => (
          <StatCard
            key={k}
            label={t(`analytics.${k === "active_users" ? "activeUsers" : k === "new_farms" ? "newFarms" : k}` as "analytics.views")}
            value={n(g!.cur[k])}
            hint={delta(g!.cur[k], g!.prev[k])?.text}
            tone={delta(g!.cur[k], g!.prev[k])?.tone}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={t("analytics.viewsPerDay")} action={exportLink("daily")}>
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
      )}

      {tab === "growth" && g && (
        <>
          <Card title={t("analytics.totals")}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label={t("analytics.totalUsers")} value={n(g.totals.users)} />
              <StatCard label={t("analytics.totalFarms")} value={n(g.totals.farms)} />
              <StatCard label={t("analytics.totalCattle")} value={n(g.totals.cattle)} />
              <StatCard label={t("analytics.totalFlocks")} value={n(g.totals.flocks)} />
            </div>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title={t("analytics.funnel")} description={t("analytics.funnelDesc")}>
              <div data-testid="funnel">
                <BarList
                  empty={t("analytics.noData")}
                  rows={(["visitors", "signups", "farms", "animals", "records"] as const).map((k, i, arr) => ({
                    label: t(`analytics.funnel.${k}`),
                    value: g.funnel[k],
                    display: i <= 1 ? n(g.funnel[k]) : `${n(g.funnel[k])} · ${pct(g.funnel[k], g.funnel[arr[i - 1]])}`,
                  }))}
                />
              </div>
              <p className="mt-3 text-xs text-stone-500">{t("analytics.funnelNote")}</p>
            </Card>

            <div className="grid content-start gap-6">
              <Card title={t("analytics.activation")} description={t("analytics.activationDesc")}>
                {g.activation.eligible === 0 ? (
                  <p className="text-sm text-stone-500">{t("analytics.activationNone")}</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold tabular-nums text-stone-900" data-testid="activation">{pct(g.activation.activated, g.activation.eligible)}</p>
                    <p className="mt-1 text-sm text-stone-500">{t("analytics.activationOf", { a: n(g.activation.activated), e: n(g.activation.eligible) })}</p>
                  </>
                )}
              </Card>
              <Card title={t("analytics.retention")} description={t("analytics.retentionDesc")}>
                <div className="grid grid-cols-3 gap-3 text-center" data-testid="retention">
                  {(["d1", "d7", "d30"] as const).map((k) => (
                    <div key={k} className="rounded-lg bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">{t(`analytics.retention.${k}`)}</p>
                      <p className="mt-1 text-xl font-bold tabular-nums">{pct(g.retention[k].returned, g.retention[k].eligible)}</p>
                      <p className="text-[11px] text-stone-500">{n(g.retention[k].returned)}/{n(g.retention[k].eligible)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <Card className="mt-6" title={t("analytics.monthly")} description={t("analytics.monthlyDesc")}>
            <BarChart
              title={t("analytics.monthly")}
              valueLabel={t("analytics.colUsers")}
              locale={locale}
              data={g.monthly.map((m) => ({ key: m.month, label: f.month(m.month), value: m.users }))}
            />
            <div className="mt-4">
              <Table head={[t("analytics.colMonth"), t("analytics.colUsers"), t("analytics.colFarms"), t("analytics.colActiveFarms")]}>
                {g.monthly.map((m) => (
                  <tr key={m.month}>
                    <Td>{f.month(m.month)}</Td>
                    <Td className="tabular-nums">{n(m.users)}</Td>
                    <Td className="tabular-nums">{n(m.farms)}</Td>
                    <Td className="tabular-nums">{n(m.active_farms)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          </Card>

          <Card className="mt-6" title={t("analytics.inactive")} description={t("analytics.inactiveDesc")} action={exportLink("inactive")}>
            {g.inactive_farms.length === 0 ? (
              <EmptyState title={t("analytics.inactiveNone")} />
            ) : (
              <div data-testid="inactive">
                <Table head={[t("analytics.colFarm"), t("analytics.colOwner"), t("analytics.colPlan"), t("analytics.colCreated"), t("analytics.colLastActivity")]}>
                  {g.inactive_farms.slice(0, 25).map((x) => (
                    <tr key={x.farm_id}>
                      <Td className="font-medium text-stone-900">{x.name}</Td>
                      <Td>
                        <span className="block">{x.owner ?? "—"}</span>
                        <span className="block text-xs text-stone-500">{x.email}</span>
                        {x.phone && <a href={`tel:${x.phone}`} className="block text-xs text-emerald-700">{x.phone}</a>}
                      </Td>
                      <Td>{x.plan}</Td>
                      <Td className="whitespace-nowrap">{f.date(x.created_at)}</Td>
                      <Td className="whitespace-nowrap">{fmtDate(x.last_activity)}</Td>
                    </tr>
                  ))}
                </Table>
                {g.inactive_farms.length > 25 && (
                  <p className="mt-3 text-xs text-stone-500">{t("analytics.showingFirst", { n: 25, total: g.inactive_farms.length })}</p>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      {tab === "features" && usage && (
        <>
          <Card title={t("analytics.featureUse")} description={t("analytics.featureUseDesc", { n: usage.total_farms })} className="mb-6">
            <div data-testid="features">
              <BarList
                empty={t("analytics.noData")}
                rows={usage.features.map((x) => ({
                  label: t(`analytics.feature.${x.key}` as "analytics.feature.milk"),
                  value: x.count,
                  display: t("analytics.farmsOf", { c: n(x.count), r: n(x.rows) }),
                }))}
              />
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={t("analytics.pagesUse")} description={t("analytics.pagesUseDesc")}>
              <BarList
                empty={t("analytics.noData")}
                rows={usage.pages.map((x) => ({
                  label: t(`analytics.page.${x.key}` as "analytics.page.quick"),
                  value: x.count,
                  display: t("analytics.peopleVisits", { c: n(x.count), r: n(x.rows) }),
                }))}
              />
            </Card>
            <Card title={t("analytics.ai")}>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label={t("analytics.aiPrompts")} value={n(usage.ai.prompts)} />
                <StatCard label={t("analytics.aiFarms")} value={n(usage.ai.farms)} />
                <StatCard label={t("analytics.aiTokens")} value={`${n(usage.ai.input_tokens)} / ${n(usage.ai.output_tokens)}`} />
              </div>
              <p className="mb-2 mt-4 text-sm font-medium text-stone-700">{t("analytics.aiByPlan")}</p>
              <BarList empty={t("analytics.noData")} rows={usage.ai.by_plan.map((x) => ({ label: x.plan, value: x.prompts, display: `${n(x.prompts)} · ${t("analytics.aiFarms")}: ${n(x.farms)}` }))} />
            </Card>
          </div>
        </>
      )}

      {tab === "traffic" && src && (
        <>
          <Card title={t("analytics.sources")} description={t("analytics.sourcesDesc")} action={exportLink("sources")}>
            {src.sources.length === 0 ? (
              <EmptyState title={t("analytics.noData")} />
            ) : (
              <div data-testid="sources">
                <Table head={[t("analytics.colSource"), t("analytics.colVisitors"), t("analytics.colSignups"), t("analytics.colRate")]}>
                  {src.sources.map((x) => (
                    <tr key={x.source}>
                      <Td className="font-medium text-stone-900">{sourceLabel(x.source)}</Td>
                      <Td className="tabular-nums">{n(x.visitors)}</Td>
                      <Td className="tabular-nums">{n(x.signups)}</Td>
                      <Td className="tabular-nums">{pct(x.signups, x.visitors)}</Td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
            <p className="mt-3 text-xs text-stone-500">{t("analytics.sourceNote", { a: n(src.attributed_signups), s: n(src.signups) })}</p>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title={t("analytics.campaigns")} description={t("analytics.campaignsDesc")}>
              {src.campaigns.length === 0 ? (
                <p className="py-4 text-sm text-stone-500">{t("analytics.noCampaigns")}</p>
              ) : (
                <Table head={[t("analytics.campaigns"), t("analytics.colVisitors"), t("analytics.colSignups")]}>
                  {src.campaigns.map((x) => (
                    <tr key={x.campaign}>
                      <Td className="font-medium text-stone-900">{x.campaign}</Td>
                      <Td className="tabular-nums">{n(x.visitors)}</Td>
                      <Td className="tabular-nums">{n(x.signups)}</Td>
                    </tr>
                  ))}
                </Table>
              )}
              <p className="mt-3 break-all rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
                {t("analytics.campaignHelp")}: https://www.farmflows.app/?utm_source=facebook&amp;utm_medium=post&amp;utm_campaign=day3
              </p>
            </Card>
            <Card title={t("analytics.landing")}>
              <BarList empty={t("analytics.noData")} rows={src.landing.map((x) => ({ label: x.path, value: x.signups, display: n(x.signups) }))} />
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card title={t("analytics.visitorKinds")}>
              <BarList
                empty={t("analytics.noData")}
                rows={[
                  { label: t("analytics.newVisitors"), value: src.visitor_kinds.new, display: n(src.visitor_kinds.new) },
                  { label: t("analytics.returningVisitors"), value: src.visitor_kinds.returning, display: n(src.visitor_kinds.returning) },
                ]}
              />
            </Card>
            <Card title={t("analytics.languages")}>
              <BarList empty={t("analytics.noData")} rows={src.locales.map((x) => ({ label: x.locale === "bn" ? "বাংলা" : x.locale === "en" ? "English" : x.locale, value: x.views, display: n(x.views) }))} />
            </Card>
            <Card title={t("analytics.topCities")}>
              <BarList empty={t("analytics.noData")} rows={src.top_cities.map((x) => ({ label: `${x.city}${x.country ? `, ${country(x.country)}` : ""}`, value: x.users, display: n(x.users) }))} />
            </Card>
          </div>

          <Card className="mt-6" title={t("analytics.blog")}>
            <BarList empty={t("analytics.noData")} rows={src.blog.map((x) => ({ label: x.path.replace("/blog/", ""), value: x.views, display: `${n(x.views)} · ${n(x.visitors)}` }))} />
          </Card>
        </>
      )}

      {tab === "business" && biz && (
        <>
          <Card title={t("analytics.waiting")}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" data-testid="waiting">
              <Link href="/admin/requests"><StatCard label={t("analytics.waitRequests")} value={n(biz.support.requests_open)} tone={biz.support.requests_open ? "bad" : "default"} /></Link>
              <Link href="/admin/messages"><StatCard label={t("analytics.waitMessages")} value={n(biz.support.messages_new)} tone={biz.support.messages_new ? "bad" : "default"} /></Link>
              <Link href="/admin/reviews"><StatCard label={t("analytics.waitReviews")} value={n(biz.support.reviews_pending)} /></Link>
              <Link href="/admin/community"><StatCard label={t("analytics.waitReports")} value={n(biz.support.reports_open)} /></Link>
              <Link href="/admin/community"><StatCard label={t("analytics.waitPosts")} value={n(biz.support.posts_waiting)} /></Link>
            </div>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title={t("analytics.plans")} description={t("analytics.plansDesc")}>
              <div data-testid="plans">
                <BarList
                  empty={t("analytics.noData")}
                  rows={biz.plans.filter((x) => x.farms > 0 || ["free", "pro", "business"].includes(x.key)).map((x) => ({
                    label: `${planName(x, locale, x.key)}${x.price === null ? ` · ${t("analytics.contactPlan")}` : x.price > 0 ? ` · ৳${f.number(x.price)}` : ""}`,
                    value: x.farms,
                    display: n(x.farms),
                  }))}
                />
              </div>
              <p className="mt-3 text-sm text-stone-700">
                {t("analytics.estIncome")}: <b className="tabular-nums">৳{f.number(biz.plans.reduce((s, x) => s + (x.price ?? 0) * x.farms, 0))}</b>
              </p>
            </Card>
            <Card title={t("analytics.requestsStats")}>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label={t("analytics.upgradeOpen")} value={n(biz.requests.upgrade_open)} />
                <StatCard label={t("analytics.supportOpen")} value={n(biz.requests.support_open)} />
                <StatCard label={t("analytics.upgradeApproved")} value={n(biz.requests.upgrade_approved)} tone="good" />
                <StatCard label={t("analytics.upgradeRejected")} value={n(biz.requests.upgrade_rejected)} />
                <StatCard label={t("analytics.supportResolved")} value={n(biz.requests.support_resolved)} />
                <StatCard label={t("analytics.avgResolve")} value={biz.requests.avg_hours_to_resolve === null ? "—" : t("analytics.hours", { n: f.number(biz.requests.avg_hours_to_resolve, 1) })} />
              </div>
            </Card>
          </div>

          <Card className="mt-6" title={t("analytics.nearLimit")} description={t("analytics.nearLimitDesc")}>
            {biz.near_limit.length === 0 ? (
              <EmptyState title={t("analytics.nearLimitNone")} />
            ) : (
              <div data-testid="near-limit">
                <Table head={[t("analytics.colFarm"), t("analytics.colPlan"), t("analytics.colUsage")]}>
                  {biz.near_limit.map((x) => (
                    <tr key={x.farm_id}>
                      <Td>
                        <span className="block font-medium text-stone-900">{x.name}</span>
                        <span className="block text-xs text-stone-500">{x.email}</span>
                      </Td>
                      <Td>{x.plan}</Td>
                      <Td className="text-xs">
                        {x.max_cattle !== null && <span className="block">{t("plan.usage.cattle")}: {n(x.cattle)}/{n(x.max_cattle)}</span>}
                        {x.max_flocks !== null && <span className="block">{t("plan.usage.flocks")}: {n(x.flocks)}/{n(x.max_flocks)}</span>}
                      </Td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
          </Card>

          <Card className="mt-6" title={t("analytics.community")}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label={t("analytics.cQuestions")} value={n(biz.community.questions)} />
              <StatCard label={t("analytics.cAnswers")} value={n(biz.community.answers)} />
              <StatCard label={t("analytics.cUnanswered")} value={n(biz.community.unanswered)} tone={biz.community.unanswered ? "bad" : "default"} />
              <StatCard label={t("analytics.cMembers")} value={n(biz.community.members_posting)} />
            </div>
          </Card>
        </>
      )}
    </>
  );
}
