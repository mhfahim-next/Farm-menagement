import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmForm } from "@/components/confirm-form";
import { Stars } from "@/components/star-input";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { deleteReview, setReviewStatus } from "../site/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("reviews.adminTitle") };
}

const FILTERS = ["pending", "approved", "rejected"] as const;
type Row = { id: string; name: string; role: string | null; rating: number; body: string; status: (typeof FILTERS)[number]; created_at: string; updated_at: string };

export default async function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const { supabase } = await requireSuperAdmin();
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const filter = FILTERS.find((x) => x === sp.status) ?? "pending";
  const { data } = await supabase.from("reviews").select("*").eq("status", filter).order("updated_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title={t("reviews.adminTitle")} description={t("reviews.adminDesc")} />
      <div className="mb-4 inline-flex rounded-lg border border-stone-300 p-0.5 text-sm">
        {FILTERS.map((x) => (
          <Link key={x} href={`?status=${x}`} className={`rounded-md px-3 py-1.5 font-medium ${filter === x ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
            {t(`review.status.${x}`)}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <Card>
          <EmptyState title={t("reviews.empty")} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-900">{r.name}</p>
                  {r.role && <p className="text-sm text-stone-500">{r.role}</p>}
                </div>
                <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"}>{t(`review.status.${r.status}`)}</Badge>
              </div>
              <div className="mt-2">
                <Stars rating={r.rating} label={t("review.stars", { n: r.rating })} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">“{r.body}”</p>
              <p className="mt-2 text-xs text-stone-500">{f.dateTime(r.updated_at)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status !== "approved" && (
                  <ConfirmForm action={setReviewStatus} fields={{ id: r.id, status: "approved" }} label={t("reviews.approve")} variant="primary" />
                )}
                {r.status !== "rejected" && <ConfirmForm action={setReviewStatus} fields={{ id: r.id, status: "rejected" }} label={t("reviews.reject")} />}
                <ConfirmForm action={deleteReview} fields={{ id: r.id }} label={t("common.delete")} variant="danger" confirm={t("reviews.confirmDelete")} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
