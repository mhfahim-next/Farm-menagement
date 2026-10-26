// Which parts of the app a farm uses, from what it keeps (farm settings).
// Money is booked to a section ("module") so each part has its own profit.

export type FarmKinds = {
  has_dairy: boolean;
  has_layer: boolean;
  has_goat?: boolean;
  has_fattening?: boolean;
  has_broiler?: boolean;
};

export const MODULES = ["dairy", "fattening", "goat", "layer", "broiler", "general"] as const;
export type Module = (typeof MODULES)[number];

export const FARM_KINDS = ["has_dairy", "has_fattening", "has_goat", "has_layer", "has_broiler"] as const;
export type FarmKind = (typeof FARM_KINDS)[number];

/** Dairy cows or fattening cattle: the cattle register. */
export const keepsCattle = (f: FarmKinds) => f.has_dairy || Boolean(f.has_fattening);
/** Any animal register (cattle, goats, sheep): health records, tags, reports. */
export const keepsAnimals = (f: FarmKinds) => keepsCattle(f) || Boolean(f.has_goat);
/** Layers, broilers or Sonali: the flock pages. */
export const keepsPoultry = (f: FarmKinds) => f.has_layer || Boolean(f.has_broiler);
/** Animals that are bred on the farm (heat, AI, pregnancy, birth). */
export const breedsAnimals = (f: FarmKinds) => f.has_dairy || Boolean(f.has_goat);
/** The fattening / Qurbani page: fattening cattle, or goats (khashi are fattened too). */
export const fattens = (f: FarmKinds) => Boolean(f.has_fattening) || Boolean(f.has_goat);

const MODULE_FLAG: Record<Exclude<Module, "general">, FarmKind> = {
  dairy: "has_dairy",
  fattening: "has_fattening",
  goat: "has_goat",
  layer: "has_layer",
  broiler: "has_broiler",
};

/** The money sections this farm uses, "general" (shared costs) last. */
export function farmModules(f: FarmKinds): Module[] {
  return [...MODULES.filter((m) => m !== "general" && Boolean(f[MODULE_FLAG[m]])), "general"];
}

export function moduleAllowed(f: FarmKinds, m: string) {
  return (farmModules(f) as string[]).includes(m);
}

export function isModule(v: unknown): v is Module {
  return typeof v === "string" && (MODULES as readonly string[]).includes(v);
}
