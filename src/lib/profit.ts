// Cost and profit per litre of milk and per egg, from one month's totals
// (public.farm_monthly_summary). Pure functions so the rules are easy to check.

export type MonthSummary = {
  month: string;
  milk_litres: number;
  eggs_collected: number;
  eggs_broken: number;
  layer_feed_kg: number;
  dairy_income: number;
  dairy_expense: number;
  layer_income: number;
  layer_expense: number;
  general_income: number;
  general_expense: number;
  dairy_feed_expense: number;
  layer_feed_expense: number;
  milk_sold_litres: number;
  milk_sales_amount: number;
  eggs_sold: number;
  egg_sales_amount: number;
};

export type SectionResult = {
  /** Money spent on this section, including its share of shared ("general") costs. */
  cost: number;
  income: number;
  profit: number;
  /** What was produced: litres of milk, or eggs collected. */
  produced: number;
  costPerUnit: number | null;
  incomePerUnit: number | null;
  profitPerUnit: number | null;
  /** Average price actually received, from recorded sales. */
  avgSalePrice: number | null;
  /** Share of the cost that went on feed (0–1). */
  feedShare: number | null;
  sharedCost: number;
};

const div = (a: number, b: number) => (b > 0 ? a / b : null);

/**
 * Shared costs and income (rent, electricity, manure… entered as "general")
 * are split between dairy and layer in proportion to each section's own costs.
 * A farm that runs only one section carries all of them there.
 * Returns dairy's share (0–1); layer gets the rest.
 */
export function dairyShare(s: MonthSummary, hasDairy: boolean, hasLayer: boolean) {
  if (!hasLayer) return 1;
  if (!hasDairy) return 0;
  const d = Number(s.dairy_expense);
  const l = Number(s.layer_expense);
  return d + l > 0 ? d / (d + l) : 0.5;
}

export function monthResults(s: MonthSummary, hasDairy: boolean, hasLayer: boolean) {
  const ratio = dairyShare(s, hasDairy, hasLayer);
  const sharedCost = Number(s.general_expense);
  const sharedIncome = Number(s.general_income);

  const section = (
    ownCost: number,
    shareOfCost: number,
    ownIncome: number,
    sharedIn: number,
    produced: number,
    feed: number,
    soldQty: number,
    soldAmount: number,
  ): SectionResult => {
    const cost = ownCost + shareOfCost;
    const income = ownIncome + sharedIn;
    const costPerUnit = div(cost, produced);
    const incomePerUnit = div(income, produced);
    return {
      cost,
      income,
      profit: income - cost,
      produced,
      costPerUnit,
      incomePerUnit,
      profitPerUnit: costPerUnit !== null && incomePerUnit !== null ? incomePerUnit - costPerUnit : null,
      avgSalePrice: div(soldAmount, soldQty),
      feedShare: div(feed, cost),
      sharedCost: shareOfCost,
    };
  };

  return {
    dairy: section(
      Number(s.dairy_expense), sharedCost * ratio, Number(s.dairy_income), sharedIncome * ratio,
      Number(s.milk_litres), Number(s.dairy_feed_expense), Number(s.milk_sold_litres), Number(s.milk_sales_amount),
    ),
    layer: section(
      Number(s.layer_expense), sharedCost * (1 - ratio), Number(s.layer_income), sharedIncome * (1 - ratio),
      Number(s.eggs_collected), Number(s.layer_feed_expense), Number(s.eggs_sold), Number(s.egg_sales_amount),
    ),
    /** kg of feed per egg collected (layer). */
    feedPerEgg: div(Number(s.layer_feed_kg), Number(s.eggs_collected)),
  };
}
