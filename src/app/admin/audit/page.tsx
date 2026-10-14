import type { Metadata } from "next";
import { Badge, Card, EmptyState, PageHeader, Table, Td } from "@/components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { AuditRow } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("admin.auditTitle") };
}

export default async function AdminAuditPage() {
  const { supabase } = await requireSuperAdmin();
  const { t, f, maybe } = await getI18n();

  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as AuditRow[];

  return (
    <>
      <PageHeader title={t("admin.auditTitle")} description={t("admin.auditDesc")} />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title={t("admin.empty")} />
        ) : (
          <Table head={[t("admin.colWhen"), t("admin.colActor"), t("admin.colAction"), t("admin.colTarget")]}>
            {rows.map((r) => {
              const detail = Object.values(r.details ?? {})
                .filter((v) => typeof v === "string" || typeof v === "number")
                .join(", ");
              return (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap">{f.dateTime(r.created_at)}</Td>
                  <Td>{r.actor_email ?? "—"}</Td>
                  <Td>
                    <Badge tone={r.action.endsWith("delete") ? "red" : "default"}>
                      {maybe(`admin.action.${r.action}`) ?? r.action}
                    </Badge>
                  </Td>
                  <Td className="text-xs">
                    {[r.target_type, r.target_id?.slice(0, 8)].filter(Boolean).join(" · ")}
                    {detail && <span className="block text-stone-500">{detail}</span>}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
