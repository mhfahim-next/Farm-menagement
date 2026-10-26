import "server-only";
import { animalProfits, type AnimalProfitData } from "@/lib/animal-profit";
import type { FarmContext } from "@/lib/auth";
import { today } from "@/lib/format";

export const PROFIT_PERIODS = ["12m", "year", "all"] as const;
export type ProfitPeriod = (typeof PROFIT_PERIODS)[number];
export const isProfitPeriod = (v: unknown): v is ProfitPeriod => typeof v === "string" && (PROFIT_PERIODS as readonly string[]).includes(v);

/** First and last day of a period, ending today. */
export function periodRange(p: ProfitPeriod) {
  const to = today();
  return { from: p === "12m" ? today(-364) : p === "year" ? `${to.slice(0, 4)}-01-01` : "2000-01-01", to };
}

/** Profit of every animal on the farm in the period (most profitable first). */
export async function loadAnimalProfits({ supabase, farm }: Pick<FarmContext, "supabase" | "farm">, period: ProfitPeriod) {
  const range = periodRange(period);
  const { data, error } = await supabase.rpc("animal_profit_data", { p_farm: farm.id, p_from: range.from, p_to: range.to });
  if (error) throw new Error(error.message);
  return { ...animalProfits(data as AnimalProfitData, farm, range), range };
}
