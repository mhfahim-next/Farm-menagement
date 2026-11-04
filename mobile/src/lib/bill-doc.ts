// The cash memo and the monthly bill as an HTML page (shared as a PDF) and as WhatsApp text.
import { memoNo, type BillPayment, type BillSale, type monthBill } from "./bill";
import type { MessageKey } from "./i18n/en";
import { escapeHtml as e } from "./report";

type Fmt = {
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  n: (v: number, digits?: number) => string;
  money: (v: number, currency: string) => string;
  date: (iso: string | null | undefined) => string;
};
type Farm = { name: string; location?: string | null; currency: string };
type Buyer = { name: string; phone: string | null; due?: number | null } | null;
export type Bill = NonNullable<ReturnType<typeof monthBill>>;

const STYLE =
  "body{font-family:sans-serif;padding:24px;color:#1c1b1f}h1{margin:0;font-size:20px}.muted{color:#666;font-size:12px}table{border-collapse:collapse;width:100%;font-size:12px;margin-top:12px}th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left}.n{text-align:right}.head{display:flex;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:8px}.tot td{font-weight:bold;border:0}";
const page = (body: string) => `<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}</style></head><body>${body}<p class="muted" style="margin-top:32px">FarmFlows</p></body></html>`;

/** Phone number for a WhatsApp link (Bangladesh numbers get the 880 country code); the website does the same. */
export function whatsappNumber(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  if (/^8801\d{9}$/.test(digits)) return digits;
  return digits.length >= 8 ? digits : null;
}
export const whatsappLink = (phone: string | null | undefined, text: string) => `https://wa.me/${whatsappNumber(phone) ?? ""}?text=${encodeURIComponent(text)}`;

const saleItem = (s: BillSale, f: Fmt, currency: string) =>
  `${f.t(`product.${s.product}` as MessageKey)}: ${f.n(Number(s.quantity), 2)} ${f.t(`unit.${s.unit}` as MessageKey)}${s.unit_price !== null && s.unit_price !== undefined ? ` × ${f.money(Number(s.unit_price), currency)}` : ""}`;

export function memoText(s: BillSale, farm: Farm, buyer: Buyer, f: Fmt) {
  const m = (v: number) => f.money(v, farm.currency);
  const amount = Number(s.amount);
  const paid = Number(s.paid_amount);
  return [
    f.t("bill.waMemo", { farm: farm.name, no: memoNo(s.id), date: f.date(s.sale_date) }),
    saleItem(s, f, farm.currency),
    `${f.t("bill.total")}: ${m(amount)}`,
    `${f.t("bill.paidNow")}: ${m(paid)}`,
    ...(amount - paid > 0 ? [`${f.t("bill.dueThis")}: ${m(amount - paid)}`] : []),
    ...(buyer && Number(buyer.due) > 0 ? [f.t("bill.waTotalDue", { amount: m(Number(buyer.due)) })] : []),
  ].join("\n");
}

export function memoHtml(s: BillSale, farm: Farm, buyer: Buyer, f: Fmt) {
  const m = (v: number) => e(f.money(v, farm.currency));
  const amount = Number(s.amount);
  const paid = Number(s.paid_amount);
  return page(
    `<div class="head"><div><h1>${e(farm.name)}</h1>${farm.location ? `<div class="muted">${e(farm.location)}</div>` : ""}</div><div class="n"><b>${e(f.t("bill.memo"))}</b><div>${e(memoNo(s.id))}</div><div>${e(f.date(s.sale_date))}</div></div></div>` +
      `<p>${e(f.t("bill.to"))}: <b>${e(buyer ? `${buyer.name}${buyer.phone ? ` · ${buyer.phone}` : ""}` : f.t("bill.cashBuyer"))}</b></p>` +
      `<table><tr><th>${e(f.t("bill.item"))}</th><th class="n">${e(f.t("bill.amount"))}</th></tr><tr><td>${e(saleItem(s, f, farm.currency))}</td><td class="n">${m(amount)}</td></tr>` +
      `<tr class="tot"><td>${e(f.t("bill.total"))}</td><td class="n">${m(amount)}</td></tr><tr><td>${e(f.t("bill.paidNow"))}</td><td class="n">${m(paid)}</td></tr>` +
      (amount - paid > 0 ? `<tr><td>${e(f.t("bill.dueThis"))}</td><td class="n">${m(amount - paid)}</td></tr>` : "") +
      (buyer && buyer.due !== undefined && buyer.due !== null ? `<tr><td>${e(f.t("bill.totalDue"))}</td><td class="n">${m(Math.max(0, Number(buyer.due)))}</td></tr>` : "") +
      `</table><p class="muted">${e(f.t("bill.thanks"))}</p>`,
  );
}

const productLine = (p: Bill["products"][number], f: Fmt, currency: string) =>
  `${f.t(`product.${p.product}` as MessageKey)}: ${f.n(p.quantity, 2)} ${f.t(`unit.${p.unit}` as MessageKey)} = ${f.money(p.amount, currency)}`;

export function billText(bill: Bill, monthName: string, farm: Farm, buyer: NonNullable<Buyer>, f: Fmt) {
  const m = (v: number) => f.money(v, farm.currency);
  return [
    f.t("bill.waBill", { name: buyer.name, farm: farm.name, month: monthName }),
    ...bill.products.map((p) => productLine(p, f, farm.currency)),
    `${f.t("bill.opening")}: ${m(bill.opening)}`,
    `${f.t("bill.monthSales")}: ${m(bill.totalSales)}`,
    `${f.t("bill.monthPaid")}: ${m(bill.paid)}`,
    `${f.t("bill.closing")}: ${m(bill.closing)}`,
  ].join("\n");
}

export function billHtml(bill: Bill, monthName: string, farm: Farm, buyer: NonNullable<Buyer>, f: Fmt) {
  const m = (v: number) => e(f.money(v, farm.currency));
  const line = (l: Bill["lines"][number]) =>
    l.kind === "sale"
      ? `<tr><td>${e(f.date(l.date))}</td><td>${e(saleItem(l.sale, f, farm.currency))}</td><td class="n">${m(Number(l.sale.amount))}</td><td class="n">${m(l.balance)}</td></tr>`
      : `<tr><td>${e(f.date(l.date))}</td><td>${e(`${f.t("sale.payment")} · ${f.t(`pay.${(l.payment as BillPayment).method}` as MessageKey)}`)}</td><td class="n">−${m(Number(l.payment.amount))}</td><td class="n">${m(l.balance)}</td></tr>`;
  return page(
    `<div class="head"><div><h1>${e(farm.name)}</h1>${farm.location ? `<div class="muted">${e(farm.location)}</div>` : ""}</div><div class="n"><b>${e(f.t("bill.title"))}</b><div>${e(monthName)}</div></div></div>` +
      `<p>${e(f.t("bill.to"))}: <b>${e(`${buyer.name}${buyer.phone ? ` · ${buyer.phone}` : ""}`)}</b></p>` +
      bill.products.map((p) => `<div>${e(productLine(p, f, farm.currency))}</div>`).join("") +
      `<table><tr><th>${e(f.t("bill.date"))}</th><th>${e(f.t("bill.item"))}</th><th class="n">${e(f.t("bill.amount"))}</th><th class="n">${e(f.t("bill.balance"))}</th></tr>` +
      `<tr><td>${e(f.date(bill.from))}</td><td>${e(f.t("bill.opening"))}</td><td></td><td class="n">${m(bill.opening)}</td></tr>${bill.lines.map(line).join("")}</table>` +
      `<table><tr><td>${e(f.t("bill.monthSales"))}</td><td class="n">${m(bill.totalSales)}</td></tr><tr><td>${e(f.t("bill.monthPaid"))}</td><td class="n">${m(bill.paid)}</td></tr><tr class="tot"><td>${e(f.t("bill.closing"))}</td><td class="n">${m(bill.closing)}</td></tr></table>` +
      `<p class="muted">${e(f.t("bill.thanks"))}</p>`,
  );
}
