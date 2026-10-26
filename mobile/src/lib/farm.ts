// What a farm keeps decides which parts of the app it sees (same as the website).
export const FARM_KINDS = ["has_dairy", "has_fattening", "has_goat", "has_layer", "has_broiler"] as const;
export type FarmKind = (typeof FARM_KINDS)[number];

export const KIND_ICON: Record<FarmKind, string> = {
  has_dairy: "cow",
  has_fattening: "weight-kilogram",
  has_goat: "sheep",
  has_layer: "egg-outline",
  has_broiler: "food-drumstick-outline",
};

export type Role = "owner" | "manager" | "worker" | "vet";

export type Farm = {
  id: string;
  name: string;
  currency: string;
  plan: string;
  plan_expires_at: string | null;
  suspended: boolean;
} & Record<FarmKind, boolean>;

export type Membership = { role: Role; farm: Farm };

export type Plan = {
  key: string;
  name_en: string;
  name_bn: string | null;
  price_monthly: number;
  price_monthly_usd: number | null;
  max_cattle: number | null;
  max_goats: number | null;
  max_flocks: number | null;
  max_members: number | null;
  max_farms: number | null;
  can_export: boolean;
  priority_support: boolean;
  max_ai_prompts: number | null;
  sort_order: number;
};
