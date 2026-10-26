"use client";

import Link from "next/link";
import { useState } from "react";
import { addSale } from "@/app/dashboard/sales/actions";
import { eggCount, PRODUCT_DEFAULTS, PRODUCTS, SALE_UNITS, type Product, type SaleUnit } from "@/lib/trade";
import { ActionForm } from "./action-form";
import { useI18n } from "./i18n-provider";
import { Field, Input, Select } from "./ui";

type BuyerOpt = { id: string; name: string; milk_rate: number | null; egg_rate: number | null; due: number };

/** Record a sale: product, buyer (or cash), quantity × rate, and how much was paid now. */
export function SaleForm({
  buyers,
  cattle,
  flocks,
  currency,
  today,
  presetBuyer,
  products,
  meatFlocks = [],
  presetProduct,
  presetFlock,
}: {
  buyers: BuyerOpt[];
  cattle: { id: string; label: string }[];
  flocks: { id: string; name: string }[];
  currency: string;
  today: string;
  presetBuyer?: string;
  products: Product[];
  /** Broiler / Sonali batches with birds alive, for a bird sale. */
  meatFlocks?: { id: string; name: string; live: number }[];
  presetProduct?: Product;
  presetFlock?: string;
}) {
  const { t, f } = useI18n();
  const [buyerId, setBuyerId] = useState(presetBuyer ?? "");
  const buyer = buyers.find((b) => b.id === buyerId);
  const first = presetProduct && products.includes(presetProduct) ? presetProduct : (products[0] ?? "milk");
  const [product, setProduct] = useState<Product>(first);
  const [unit, setUnit] = useState<SaleUnit>(PRODUCT_DEFAULTS[first].unit);
  const [heads, setHeads] = useState("");
  const [batchId, setBatchId] = useState(presetFlock && meatFlocks.some((x) => x.id === presetFlock) ? presetFlock : (meatFlocks[0]?.id ?? ""));
  const batch = meatFlocks.find((x) => x.id === batchId);
  const [qty, setQty] = useState("");
  const usualRate = (p: Product, b?: BuyerOpt) => (p === "milk" ? b?.milk_rate : p === "eggs" ? b?.egg_rate : null);
  const [rate, setRate] = useState(String(usualRate(first, buyer) ?? ""));
  const [paid, setPaid] = useState("");

  const q = Number(qty);
  const r = Number(rate);
  const total = qty !== "" && rate !== "" && q > 0 && r >= 0 ? Math.round(q * r * 100) / 100 : null;
  const paidNum = buyerId ? Math.min(Number(paid || 0), total ?? Infinity) : total ?? 0;
  const owed = total !== null && buyerId ? Math.max(0, Math.round((total - paidNum) * 100) / 100) : 0;
  const eggs = product === "eggs" && q > 0 ? eggCount(q, unit) : null;
  const perBird = product === "birds" && q > 0 && Number(heads) > 0 ? q / Number(heads) : null;
  const money = (n: number) => f.money(n, currency);

  function pickProduct(p: Product) {
    setProduct(p);
    setUnit(PRODUCT_DEFAULTS[p].unit);
    const usual = usualRate(p, buyer);
    if (usual != null) setRate(String(usual));
  }
  function pickBuyer(id: string) {
    setBuyerId(id);
    const usual = usualRate(product, buyers.find((b) => b.id === id));
    if (usual != null) setRate(String(usual));
  }

  return (
    <ActionForm action={addSale} submitLabel={t("sales.saveSale")} successHref="/dashboard/sales">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("sales.product")}>
          <Select
            name="product"
            value={product}
            onChange={(e) => pickProduct(e.target.value as Product)}
            options={PRODUCTS.filter((p) => products.includes(p)).map((p) => ({ value: p, label: t(`sales.productName.${p}`) }))}
          />
        </Field>
        <Field label={t("common.date")}>
          <Input name="sale_date" type="date" defaultValue={today} max={today} required />
        </Field>
      </div>

      <Field label={t("sales.buyer")} hint={buyer && buyer.due > 0 ? t("sales.alreadyOwes", { amount: money(buyer.due) }) : t("sales.buyerHint")}>
        <span className="flex gap-2">
          <Select
            name="buyer_id"
            value={buyerId}
            onChange={(e) => pickBuyer(e.target.value)}
            options={[{ value: "", label: t("sales.cashBuyer") }, ...buyers.map((b) => ({ value: b.id, label: b.name }))]}
          />
          <Link href="/dashboard/sales/buyers/new?back=sale" className="shrink-0 self-center whitespace-nowrap text-sm font-medium text-emerald-700 hover:underline">
            + {t("sales.newBuyer")}
          </Link>
        </span>
      </Field>

      {product === "animal" && cattle.length > 0 && (
        <Field label={t("sales.whichAnimal")} hint={t("sales.whichAnimalHint")}>
          <Select name="cattle_id" options={[{ value: "", label: "—" }, ...cattle.map((c) => ({ value: c.id, label: c.label }))]} />
        </Field>
      )}
      {product === "birds" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("broiler.batch")} hint={batch ? t("broiler.liveNow", { n: f.number(batch.live) }) : undefined}>
            <Select
              name="flock_id"
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              options={meatFlocks.map((x) => ({ value: x.id, label: x.name }))}
            />
          </Field>
          <Field label={t("broiler.birdsSold")}>
            <Input
              name="head_count"
              type="number"
              min="1"
              step="1"
              max={batch?.live}
              inputMode="numeric"
              required
              value={heads}
              onChange={(e) => setHeads(e.target.value)}
              data-testid="head-count"
            />
          </Field>
        </div>
      )}
      {(product === "eggs" || product === "animal") && flocks.length > 0 && (
        <Field label={t("sales.whichFlock")}>
          <Select name="flock_id" options={[{ value: "", label: "—" }, ...flocks.map((x) => ({ value: x.id, label: x.name }))]} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label={product === "birds" ? t("broiler.totalKg") : t("finance.quantity")}>
          <Input name="quantity" type="number" min="0.001" step="0.001" inputMode="decimal" required value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        {product === "birds" ? (
          <input type="hidden" name="unit" value="kg" />
        ) : (
          <Field label={t("sales.unit")}>
            <Select
              name="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as SaleUnit)}
              options={SALE_UNITS.map((u) => ({ value: u, label: t(`sales.unitName.${u}`) }))}
            />
          </Field>
        )}
        <Field label={product === "birds" ? t("broiler.ratePerKg", { cur: currency }) : t("sales.ratePer", { cur: currency })} className="col-span-2 sm:col-span-1">
          <Input name="unit_price" type="number" min="0" step="0.01" inputMode="decimal" required value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </div>
      {perBird !== null && <p className="-mt-2 text-xs text-stone-500">{t("broiler.perBird", { kg: f.number(perBird, 2) })}</p>}
      {eggs !== null && <p className="-mt-2 text-xs text-stone-500">{t("sales.eggsEquals", { n: f.number(eggs) })}</p>}

      {product === "milk" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("sales.fat")}>
            <Input name="fat_percent" type="number" min="0" max="15" step="0.01" inputMode="decimal" />
          </Field>
          <Field label={t("sales.snf")}>
            <Input name="snf_percent" type="number" min="0" max="15" step="0.01" inputMode="decimal" />
          </Field>
        </div>
      )}

      <div className="rounded-lg bg-stone-50 p-3">
        <p className="flex items-baseline justify-between text-sm text-stone-600">
          {t("sales.total")}
          <span className="text-xl font-bold text-stone-900 tabular-nums">{total !== null ? money(total) : "—"}</span>
        </p>
        {buyerId ? (
          <div className="mt-3 grid gap-2">
            <Field label={t("sales.paidNow", { cur: currency })}>
              <span className="flex gap-2">
                <Input name="paid_amount" type="number" min="0" step="0.01" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
                <button
                  type="button"
                  disabled={total === null}
                  onClick={() => total !== null && setPaid(String(total))}
                  className="shrink-0 rounded-lg border border-stone-300 px-3 text-sm hover:bg-white disabled:opacity-50"
                >
                  {t("sales.paidFull")}
                </button>
              </span>
            </Field>
            {total !== null && (
              <p className={`text-sm font-medium ${owed > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                {owed > 0 ? t("sales.willOwe", { amount: money(owed) }) : t("sales.fullyPaid")}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-stone-500">{t("sales.cashNote")}</p>
        )}
      </div>

      <Field label={t("common.notes")}>
        <Input name="notes" maxLength={500} />
      </Field>
    </ActionForm>
  );
}
