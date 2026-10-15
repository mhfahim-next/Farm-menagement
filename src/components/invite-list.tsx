import { ActionForm } from "@/components/action-form";
import { Card } from "@/components/ui";
import type { I18n } from "@/lib/i18n/core";
import { respondInvite } from "@/app/invites/actions";

export type PendingInvite = {
  id: string;
  farm_id: string;
  farm_name: string;
  role: string;
  invited_by_name: string | null;
  created_at: string;
};

/** Pending farm invitations with Accept / Decline. Server component. */
export function InviteList({ invites, i18n }: { invites: PendingInvite[]; i18n: Pick<I18n, "t" | "o" | "f"> }) {
  const { t, o, f } = i18n;
  if (invites.length === 0) return null;

  return (
    <div className="grid gap-3" data-testid="invite-list">
      {invites.map((inv) => (
        <Card key={inv.id} className="border-sky-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-stone-900">{inv.farm_name}</p>
              <p className="text-sm text-stone-600">
                {inv.invited_by_name
                  ? t("invites.invitedAs", { who: inv.invited_by_name, role: o("member_role", inv.role) })
                  : t("invites.invitedAnon", { role: o("member_role", inv.role) })}
              </p>
              <p className="text-xs text-stone-500">{f.date(inv.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <InviteButton invite={inv} accept label={t("invites.accept")} />
              <InviteButton invite={inv} accept={false} label={t("invites.decline")} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InviteButton({ invite, accept, label }: { invite: PendingInvite; accept: boolean; label: string }) {
  return (
    <ActionForm action={respondInvite} submitLabel={label} submitVariant={accept ? "primary" : "secondary"} className="inline-grid gap-2">
      <input type="hidden" name="id" value={invite.id} />
      <input type="hidden" name="farm_id" value={invite.farm_id} />
      <input type="hidden" name="farm_name" value={invite.farm_name} />
      <input type="hidden" name="role" value={invite.role} />
      <input type="hidden" name="accept" value={String(accept)} />
    </ActionForm>
  );
}
