import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmForm } from "@/components/confirm-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { setContactStatus } from "../site/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("messages.title") };
}

const FILTERS = ["new", "read", "archived", "all"] as const;
type Msg = { id: string; name: string; email: string | null; phone: string | null; subject: string | null; message: string; status: "new" | "read" | "archived"; created_at: string };

export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const { supabase } = await requireSuperAdmin();
  const { t, f } = await getI18n();
  const sp = await searchParams;
  const filter = FILTERS.find((x) => x === sp.status) ?? "new";
  let q = supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
  if (filter !== "all") q = q.eq("status", filter);
  const { data } = await q;
  const msgs = (data ?? []) as Msg[];

  return (
    <>
      <PageHeader title={t("messages.title")} description={t("messages.desc")} />
      <div className="mb-4 inline-flex rounded-lg border border-stone-300 p-0.5 text-sm">
        {FILTERS.map((x) => (
          <Link key={x} href={`?status=${x}`} className={`rounded-md px-3 py-1.5 font-medium ${filter === x ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
            {t(`messages.filter.${x}`)}
          </Link>
        ))}
      </div>
      {msgs.length === 0 ? (
        <Card>
          <EmptyState title={t("messages.empty")} />
        </Card>
      ) : (
        <div className="grid gap-4">
          {msgs.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">
                    {m.name} {m.status === "new" && <Badge tone="green">{t("messages.filter.new")}</Badge>}
                  </p>
                  <p className="mt-0.5 flex flex-wrap gap-x-4 text-sm">
                    {m.email && <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "FarmFlows"}`)}`} className="text-emerald-700 hover:underline">{m.email}</a>}
                    {m.phone && <a href={`tel:${m.phone}`} className="text-emerald-700 hover:underline">{m.phone}</a>}
                  </p>
                </div>
                <p className="text-xs text-stone-500">{f.dateTime(m.created_at)}</p>
              </div>
              {m.subject && <p className="mt-3 font-medium text-stone-800">{m.subject}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.status !== "read" && <ConfirmForm action={setContactStatus} fields={{ id: m.id, status: "read" }} label={t("messages.markRead")} />}
                {m.status !== "archived" && <ConfirmForm action={setContactStatus} fields={{ id: m.id, status: "archived" }} label={t("messages.archive")} />}
                {m.status !== "new" && <ConfirmForm action={setContactStatus} fields={{ id: m.id, status: "new" }} label={t("messages.markNew")} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
