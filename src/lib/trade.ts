// Stock (feed, medicine…) and sales to buyers. Pure helpers shared by pages and actions.

export const ITEM_KINDS = ["feed", "medicine", "vaccine", "supplement", "other"] as const;
export const ITEM_UNITS = ["kg", "bag", "litre", "ml", "dose", "piece", "packet", "bottle"] as const;
export const MOVE_TYPES = ["purchase", "use", "adjust"] as const;
export const PRODUCTS = ["milk", "eggs", "animal", "manure", "other"] as const;
export const SALE_UNITS = ["litre", "kg", "piece", "hali", "dozen", "tray", "head", "other"] as const;
export const PAY_METHODS = ["cash", "bkash", "nagad", "rocket", "bank", "other"] as const;

export type ItemKind = (typeof ITEM_KINDS)[number];
export type ItemUnit = (typeof ITEM_UNITS)[number];
export type MoveType = (typeof MOVE_TYPES)[number];
export type Product = (typeof PRODUCTS)[number];
export type SaleUnit = (typeof SALE_UNITS)[number];
export type PayMethod = (typeof PAY_METHODS)[number];
export type Module = "dairy" | "layer" | "general";

export type StockItem = {
  id: string;
  farm_id: string;
  name: string;
  kind: ItemKind;
  unit: ItemUnit;
  unit_kg: number | null;
  module: Module;
  low_stock: number | null;
  notes: string | null;
  archived: boolean;
  on_hand: number;
  purchased: number;
  avg_cost: number | null;
  used_30d: number;
  last_purchase: string | null;
};

export type StockMove = {
  id: string;
  item_id: string;
  move_date: string;
  move_type: MoveType;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  module: Module | null;
  flock_id: string | null;
  log_id: string | null;
  supplier: string | null;
  notes: string | null;
};

export type Buyer = {
  id: string;
  name: string;
  phone: string | null;
  milk_rate: number | null;
  egg_rate: number | null;
  notes: string | null;
  archived: boolean;
  total_sales: number;
  total_paid: number;
  due: number;
  last_sale: string | null;
  last_payment: string | null;
};

export type Sale = {
  id: string;
  buyer_id: string | null;
  sale_date: string;
  product: Product;
  module: Module;
  quantity: number;
  unit: SaleUnit;
  unit_price: number | null;
  amount: number;
  paid_amount: number;
  fat_percent: number | null;
  snf_percent: number | null;
  cattle_id: string | null;
  flock_id: string | null;
  notes: string | null;
};

export type Payment = { id: string; buyer_id: string; pay_date: string; amount: number; method: PayMethod; notes: string | null };

/** Usual unit and farm section for each product. */
export const PRODUCT_DEFAULTS: Record<Product, { unit: SaleUnit; module: Module }> = {
  milk: { unit: "litre", module: "dairy" },
  eggs: { unit: "piece", module: "layer" },
  animal: { unit: "head", module: "dairy" },
  manure: { unit: "kg", module: "general" },
  other: { unit: "other", module: "general" },
};

/** Eggs in one unit (hali = 4 in Bangladesh, tray = 30). */
const EGGS_PER: Partial<Record<SaleUnit, number>> = { piece: 1, hali: 4, dozen: 12, tray: 30 };

/** Number of eggs in a sale, or null when the unit doesn't count eggs. */
export function eggCount(quantity: number, unit: SaleUnit) {
  const per = EGGS_PER[unit];
  return per ? quantity * per : null;
}

/** Days of stock left at the last 30 days' rate of use (null when nothing was used). */
export function daysLeft(item: Pick<StockItem, "on_hand" | "used_30d">) {
  const perDay = Number(item.used_30d) / 30;
  if (perDay <= 0) return null;
  return Math.max(0, Math.floor(Number(item.on_hand) / perDay));
}

export function isLow(item: Pick<StockItem, "on_hand" | "low_stock">) {
  return item.low_stock !== null && Number(item.on_hand) <= Number(item.low_stock);
}

/** A buyer's statement: sales and payments in date order with a running balance. */
export function statement(sales: Sale[], payments: Payment[]) {
  type Line =
    | { kind: "sale"; date: string; id: string; sale: Sale; delta: number; balance: number }
    | { kind: "payment"; date: string; id: string; payment: Payment; delta: number; balance: number };
  const lines: Omit<Line, "balance">[] = [
    ...sales.map((s) => ({ kind: "sale" as const, date: s.sale_date, id: s.id, sale: s, delta: Number(s.amount) - Number(s.paid_amount) })),
    ...payments.map((p) => ({ kind: "payment" as const, date: p.pay_date, id: p.id, payment: p, delta: -Number(p.amount) })),
  ].sort((a, b) => a.date.localeCompare(b.date) || (a.kind === b.kind ? 0 : a.kind === "sale" ? -1 : 1));
  let balance = 0;
  return lines.map((l) => {
    balance = Math.round((balance + l.delta) * 100) / 100;
    return { ...l, balance } as Line;
  });
}

/** Phone number for a WhatsApp link (Bangladesh numbers get the 880 country code). */
export function whatsappNumber(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  if (/^8801\d{9}$/.test(digits)) return digits;
  return digits.length >= 8 ? digits : null;
}
