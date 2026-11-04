import type { Metadata } from "next";
import Link from "@/components/local-link";
import { ActionForm } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { MANAGERS, requireFarm } from "@/lib/auth";
import { districtByKey, districtIn, DISTRICTS } from "@/lib/districts";
import { getI18n } from "@/lib/i18n/server";
import { whatsappNumber } from "@/lib/trade";
import { inviteListedDoctor } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("vets.title") };
}

type Doctor = { id: string; full_name: string | null; avatar_url: string | null; specialty: string | null; district: string | null; area: string | null; phone: string | null; farms_served: number };

/** Verified doctors who chose to be listed, the farm's district first; owners and managers can invite one. */
export default async function DoctorsPage({ searchParams }: PageProps<"/dashboard/doctors">) {
  const { supabase, farm, role } = await requireFarm();
  const { t, o, locale } = await getI18n();
  const sp = await searchParams;
  const asked = typeof sp.district === "string" ? sp.district : undefined;
  const district = asked === "all" ? null : (districtByKey(asked)?.key ?? (asked === undefined ? districtIn(farm.location) : null));
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const { data, error } = await supabase.rpc("find_doctors", { p_district: district, p_search: q || null, p_only_district: false, p_limit: 60 });
  const doctors = (data ?? []) as Doctor[];
  const canInvite = MANAGERS.includes(role);
  const name = (key: string | null) => {
    const d = districtByKey(key);
    return d ? (locale === "bn" ? d.bn : d.en) : null;
  };
  const here = doctors.filter((d) => district && d.district === district);
  const others = doctors.filter((d) => !district || d.district !== district);

  const card = (d: Doctor) => (
    <li key={d.id} className="rounded-xl border border-stone-200 bg-white p-4" data-testid={`vet-${d.id}`}>
      <div className="flex items-start gap-3">
        <Avatar url={d.avatar_url} name={d.full_name} email={null} size={48} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900">
            {d.full_name ?? "—"} <Badge tone="green">{t("doctor.badgeVerified")}</Badge>
          </p>
          {d.specialty && <p className="text-sm text-stone-700">{o("doctor_specialty", d.specialty)}</p>}
          <p className="text-sm text-stone-600">{[d.area, name(d.district)].filter(Boolean).join(", ") || t("vets.noArea")}</p>
          <p className="text-xs text-stone-500">{t("vets.serves", { n: Number(d.farms_served) })}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {d.phone && (
              <>
                <a href={`tel:${d.phone}`} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50" data-testid="vet-call">
                  📞 {d.phone}
                </a>
                <a href={`https://wa.me/${whatsappNumber(d.phone) ?? ""}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50">
                  WhatsApp
                </a>
              </>
            )}
            {canInvite && (
              <ActionForm action={inviteListedDoctor} submitLabel={t("vets.invite")} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="doctor" value={d.id} />
              </ActionForm>
            )}
          </div>
        </div>
      </div>
    </li>
  );

  return (
    <>
      <PageHeader title={t("vets.title")} description={t("vets.desc")} />
      <Card className="mb-6">
        <form className="grid gap-3 sm:grid-cols-[14rem_1fr_auto] sm:items-end" method="get">
          <label className="grid gap-1.5 text-sm font-medium text-stone-700">
            {t("vets.district")}
            <Select
              name="district"
              defaultValue={district ?? "all"}
              options={[{ value: "all", label: t("vets.allDistricts") }, ...DISTRICTS.map((d) => ({ value: d.key, label: locale === "bn" ? d.bn : d.en }))]}
              data-testid="vets-district"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-stone-700">
            {t("vets.search")}
            <Input name="q" defaultValue={q} placeholder={t("vets.searchHint")} data-testid="vets-search" />
          </label>
          <Button type="submit" variant="secondary">
            {t("vets.find")}
          </Button>
        </form>
        {!canInvite && <p className="mt-3 text-xs text-stone-500">{t("vets.askOwner")}</p>}
      </Card>
      {error ? (
        <Card>
          <EmptyState title={t("vets.unavailable")} />
        </Card>
      ) : doctors.length === 0 ? (
        <Card>
          <EmptyState title={t("vets.none")}>{t("vets.noneHint")}</EmptyState>
        </Card>
      ) : (
        <div className="grid gap-6" data-testid="vets-list">
          {district && (
            <section>
              <h2 className="mb-2 font-semibold text-stone-900">{t("vets.inDistrict", { district: name(district) ?? "" })}</h2>
              {here.length === 0 ? <p className="text-sm text-stone-600">{t("vets.noneHere")}</p> : <ul className="grid gap-3 md:grid-cols-2">{here.map(card)}</ul>}
            </section>
          )}
          {others.length > 0 && (
            <section>
              {district && <h2 className="mb-2 font-semibold text-stone-900">{t("vets.elsewhere")}</h2>}
              <ul className="grid gap-3 md:grid-cols-2">{others.map(card)}</ul>
            </section>
          )}
        </div>
      )}
      <p className="mt-6 text-sm text-stone-600">
        {t("vets.footer")}{" "}
        <Link href="/dashboard/diseases" className="font-medium text-emerald-700 hover:underline">
          {t("nav.diseases")}
        </Link>
      </p>
    </>
  );
}
