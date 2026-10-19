"use client";

import { useEffect, useRef, useState } from "react";
import { ActionForm, type OfflineOptions } from "@/components/action-form";
import { useI18n } from "@/components/i18n-provider";
import { Card, EmptyState, Field, Input, Select, Table, Td } from "@/components/ui";
import { today } from "@/lib/format";
import { removeEntry, type OutboxKind } from "@/lib/offline/outbox";
import { OUTBOX_ACTIONS } from "./actions";
import { useOnline, useOutbox } from "./offline-sync";

export type QuickData = {
  farmId: string;
  farmName: string;
  userId: string;
  serverToday: string;
  hasDairy: boolean;
  hasLayer: boolean;
  isManager: boolean;
  cows: { id: string; tag_number: string; name: string | null }[];
  flocks: { id: string; name: string; lastFeed: string }[];
  layerFeeds: { id: string; name: string }[];
  items: { id: string; name: string; unit: string; module: string }[];
  staff: { id: string; name: string }[];
};

/**
 * A date field that starts on today. This page may be a copy saved days ago,
 * so "today" is worked out on the phone rather than taken from the page.
 */
function DateField({ name, label, serverToday }: { name: string; label: string; serverToday: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [max, setMax] = useState(serverToday);
  useEffect(() => {
    const now = today();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the phone's date is only known after mount
    setMax(now);
    if (ref.current && ref.current.value === serverToday) ref.current.value = now;
  }, [serverToday]);
  return (
    <Field label={label}>
      <Input ref={ref} name={name} type="date" defaultValue={serverToday} max={max} required />
    </Field>
  );
}

export function QuickEntry({ data }: { data: QuickData }) {
  const { t, f, o, options } = useI18n();
  const tabs: { key: OutboxKind; label: string }[] = [
    ...(data.hasDairy ? [{ key: "milk" as const, label: t("offline.kind.milk") }] : []),
    ...(data.hasLayer ? [{ key: "flock" as const, label: t("offline.kind.flock") }] : []),
    { key: "stockUse", label: t("offline.kind.stockUse") },
    ...(data.isManager ? [{ key: "attendance" as const, label: t("offline.kind.attendance") }] : []),
  ];
  const [tab, setTab] = useState<OutboxKind>(tabs[0].key);
  const [flockId, setFlockId] = useState(data.flocks[0]?.id ?? "");

  const offline = (kind: OutboxKind, label: (fd: FormData) => string): OfflineOptions => ({
    kind,
    farmId: data.farmId,
    farmName: data.farmName,
    userId: data.userId,
    label,
  });
  const day = (fd: FormData, key: string) => {
    const v = fd.get(key);
    return typeof v === "string" && v ? f.date(v) : "";
  };
  const join = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" · ");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <div role="tablist" aria-label={t("offline.title")} className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-stone-300 p-0.5 text-sm no-scrollbar">
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => setTab(x.key)}
              className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 font-medium ${tab === x.key ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100"}`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {tab === "milk" && (
          <Card>
            {data.cows.length === 0 ? (
              <EmptyState title={t("milk.noCowsTitle")}>{t("milk.noCowsBody")}</EmptyState>
            ) : (
              <ActionForm
                action={OUTBOX_ACTIONS.milk}
                submitLabel={t("milk.saveMilking")}
                offline={offline("milk", (fd) => {
                  let cows = 0;
                  let litres = 0;
                  for (const [k, v] of fd.entries()) {
                    if (k.startsWith("qty_") && typeof v === "string" && v.trim() !== "") {
                      cows++;
                      litres += Number(v) || 0;
                    }
                  }
                  return join(t("offline.kind.milk"), day(fd, "record_date"), o("milk_session", String(fd.get("session"))), t("offline.cowsLitres", { n: cows, l: f.number(litres, 1) }));
                })}
              >
                <div className="grid grid-cols-2 gap-3">
                  <DateField name="record_date" label={t("common.date")} serverToday={data.serverToday} />
                  <Field label={t("milk.session")}>
                    <Select name="session" options={options("milk_session")} />
                  </Field>
                </div>
                <Table head={[t("milk.colCow"), t("milk.colLitres"), t("milk.colFat")]}>
                  {data.cows.map((c) => (
                    <tr key={c.id}>
                      <Td className="whitespace-nowrap">
                        <span className="font-medium">{c.tag_number}</span>
                        {c.name && <span className="text-stone-500"> · {c.name}</span>}
                      </Td>
                      <Td>
                        <Input name={`qty_${c.id}`} type="number" inputMode="decimal" min="0" step="0.01" className="w-24" aria-label={`${c.tag_number} ${t("milk.colLitres")}`} />
                      </Td>
                      <Td>
                        <Input name={`fat_${c.id}`} type="number" inputMode="decimal" min="0" max="15" step="0.01" className="w-20" aria-label={`${c.tag_number} ${t("milk.colFat")}`} />
                      </Td>
                    </tr>
                  ))}
                </Table>
              </ActionForm>
            )}
          </Card>
        )}

        {tab === "flock" && (
          <Card>
            {data.flocks.length === 0 ? (
              <EmptyState title={t("offline.noFlocks")} />
            ) : (
              <ActionForm
                action={OUTBOX_ACTIONS.flock}
                submitLabel={t("flocks.saveLog")}
                offline={offline("flock", (fd) =>
                  join(
                    data.flocks.find((x) => x.id === fd.get("flock_id"))?.name ?? t("offline.kind.flock"),
                    day(fd, "log_date"),
                    t("offline.eggs", { n: Number(fd.get("eggs_collected")) || 0 }),
                  ),
                )}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("offline.flock")}>
                    <Select name="flock_id" value={flockId} onChange={(e) => setFlockId(e.target.value)} options={data.flocks.map((x) => ({ value: x.id, label: x.name }))} />
                  </Field>
                  <DateField name="log_date" label={t("common.date")} serverToday={data.serverToday} />
                  <Field label={t("flocks.eggsCollected")}>
                    <Input name="eggs_collected" type="number" min="0" inputMode="numeric" required />
                  </Field>
                  <Field label={t("flocks.eggsBroken")}>
                    <Input name="eggs_broken" type="number" min="0" inputMode="numeric" />
                  </Field>
                  <Field label={t("flocks.deaths")}>
                    <Input name="mortality" type="number" min="0" inputMode="numeric" />
                  </Field>
                  <Field label={t("flocks.culled")}>
                    <Input name="culled" type="number" min="0" inputMode="numeric" />
                  </Field>
                  <Field label={t("flocks.feedKg")}>
                    <Input name="feed_kg" type="number" min="0" step="0.1" inputMode="decimal" />
                  </Field>
                  <Field label={t("flocks.waterL")}>
                    <Input name="water_liters" type="number" min="0" step="0.1" inputMode="decimal" />
                  </Field>
                </div>
                {data.layerFeeds.length > 0 && (
                  <Field label={t("stock.feedFrom")} hint={t("stock.feedFromHint")}>
                    <Select
                      key={flockId}
                      name="feed_item_id"
                      defaultValue={data.flocks.find((x) => x.id === flockId)?.lastFeed ?? ""}
                      options={[{ value: "", label: t("stock.feedNone") }, ...data.layerFeeds.map((x) => ({ value: x.id, label: x.name }))]}
                    />
                  </Field>
                )}
                <Field label={t("common.notes")}>
                  <Input name="notes" />
                </Field>
              </ActionForm>
            )}
          </Card>
        )}

        {tab === "stockUse" && (
          <Card>
            {data.items.length === 0 ? (
              <EmptyState title={t("offline.noItems")} />
            ) : (
              <ActionForm
                action={OUTBOX_ACTIONS.stockUse}
                submitLabel={t("offline.saveUse")}
                offline={offline("stockUse", (fd) => {
                  const item = data.items.find((x) => x.id === fd.get("item_id"));
                  return join(
                    t("offline.kind.stockUse"),
                    item?.name,
                    item && `${f.number(Number(fd.get("quantity")) || 0, 3)} ${t(`stock.unit.${item.unit}` as Parameters<typeof t>[0])}`,
                    day(fd, "move_date"),
                  );
                })}
              >
                <input type="hidden" name="move_type" value="use" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("offline.item")} className="col-span-2">
                    <Select
                      name="item_id"
                      options={data.items.map((x) => ({ value: x.id, label: `${x.name} (${t(`stock.unit.${x.unit}` as Parameters<typeof t>[0])})` }))}
                    />
                  </Field>
                  <Field label={t("offline.quantity")}>
                    <Input name="quantity" type="number" min="0" step="0.001" inputMode="decimal" required />
                  </Field>
                  <DateField name="move_date" label={t("common.date")} serverToday={data.serverToday} />
                  <Field label={t("offline.usedFor")}>
                    <Select
                      name="module"
                      defaultValue="general"
                      options={options("txn_module").filter((m) => (m.value !== "dairy" || data.hasDairy) && (m.value !== "layer" || data.hasLayer))}
                    />
                  </Field>
                  {data.flocks.length > 0 && (
                    <Field label={t("offline.flock")}>
                      <Select name="flock_id" options={[{ value: "", label: "—" }, ...data.flocks.map((x) => ({ value: x.id, label: x.name }))]} />
                    </Field>
                  )}
                </div>
                <Field label={t("common.notes")}>
                  <Input name="notes" />
                </Field>
              </ActionForm>
            )}
          </Card>
        )}

        {tab === "attendance" && (
          <Card description={t("offline.attendanceHint")} title={t("offline.kind.attendance")}>
            {data.staff.length === 0 ? (
              <EmptyState title={t("offline.noStaff")} />
            ) : (
              <ActionForm
                action={OUTBOX_ACTIONS.attendance}
                submitLabel={t("offline.saveAttendance")}
                offline={offline("attendance", (fd) => {
                  let away = 0;
                  for (const [k, v] of fd.entries()) if (k.startsWith("status_") && v !== "present") away++;
                  return join(t("offline.kind.attendance"), day(fd, "att_date"), t("offline.absent", { n: away }));
                })}
              >
                <DateField name="att_date" label={t("common.date")} serverToday={data.serverToday} />
                <Table head={[t("offline.person"), t("offline.status")]}>
                  {data.staff.map((s) => (
                    <tr key={s.id}>
                      <Td className="font-medium">{s.name}</Td>
                      <Td>
                        <Select name={`status_${s.id}`} defaultValue="present" options={options("attendance_status")} className="w-36" aria-label={s.name} />
                      </Td>
                    </tr>
                  ))}
                </Table>
              </ActionForm>
            )}
          </Card>
        )}
      </div>

      <Outbox userId={data.userId} farmId={data.farmId} />
    </div>
  );
}

/** Entries saved on this phone that have not reached the server yet. */
function Outbox({ userId, farmId }: { userId: string; farmId: string }) {
  const { t, f } = useI18n();
  const online = useOnline();
  const entries = useOutbox(userId);
  return (
    <Card title={t("offline.listTitle")} description={entries.length === 0 ? undefined : online ? t("offline.listOnline") : t("offline.listOffline")} className="h-fit">
      <div id="outbox" data-testid="outbox">
        {entries.length === 0 ? (
          <p className="text-sm text-stone-500">{t("offline.listEmpty")}</p>
        ) : (
          <ul className="divide-y divide-stone-100 text-sm">
            {entries.map((e) => (
              <li key={e.id} className="py-2.5" data-testid="outbox-entry">
                <p className="font-medium text-stone-800">{e.label}</p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {e.error ? (
                    <span className="text-red-700">⚠ {e.error}</span>
                  ) : e.farmId !== farmId ? (
                    t("offline.otherFarm", { farm: e.farmName })
                  ) : (
                    t("offline.savedAt", { time: f.dateTime(new Date(e.createdAt).toISOString()) })
                  )}
                </p>
                {e.error && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("offline.discardConfirm"))) removeEntry(e.id);
                    }}
                    className="mt-1 text-xs font-medium text-red-700 underline"
                  >
                    {t("offline.discard")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
