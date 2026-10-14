// Row types mirroring supabase/migrations. Regenerate with
// `npx supabase gen types typescript` once the project is linked.

export type Role = "owner" | "manager" | "worker" | "vet";

export type Farm = {
  id: string;
  name: string;
  owner_id: string;
  location: string | null;
  currency: string;
  has_dairy: boolean;
  has_layer: boolean;
  plan: "free" | "pro" | "business";
  created_at: string;
};

export type Cattle = {
  id: string;
  farm_id: string;
  tag_number: string;
  name: string | null;
  breed: string | null;
  sex: "female" | "male";
  category: "cow" | "heifer" | "calf" | "bull" | "steer";
  status: "active" | "sold" | "dead";
  date_of_birth: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  notes: string | null;
  created_at: string;
};

export type MilkRecord = {
  id: string;
  cattle_id: string;
  record_date: string;
  session: "morning" | "evening" | "other";
  quantity_liters: number;
  fat_percent: number | null;
  notes: string | null;
};

export type HealthRecord = {
  id: string;
  cattle_id: string;
  record_date: string;
  record_type: HealthRecordType;
  description: string;
  product: string | null;
  dose: string | null;
  batch_number: string | null;
  interval_days: number | null;
  next_due_date: string | null;
  medicine: string | null;
  vet_name: string | null;
  cost: number | null;
  withdrawal_until: string | null;
};

export type HealthRecordType =
  | "vaccination"
  | "deworming"
  | "parasite_control"
  | "treatment"
  | "checkup";

export type BreedingEvent = {
  id: string;
  cattle_id: string;
  event_date: string;
  event_type: "heat" | "insemination" | "pregnancy_check" | "calving" | "dry_off";
  bull_or_semen: string | null;
  result: string | null;
  expected_calving_date: string | null;
  heat_signs: string | null;
  technician: string | null;
  cost: number | null;
  notes: string | null;
};

export type Flock = {
  id: string;
  farm_id: string;
  name: string;
  breed: string | null;
  shed: string | null;
  placed_date: string;
  age_at_placement_weeks: number;
  initial_count: number;
  status: "active" | "sold" | "culled";
  notes: string | null;
};

export type FlockStats = {
  flock_id: string;
  initial_count: number;
  total_mortality: number;
  total_culled: number;
  current_count: number;
  total_eggs: number;
  total_feed_kg: number;
};

export type FlockDailyLog = {
  id: string;
  flock_id: string;
  log_date: string;
  eggs_collected: number;
  eggs_broken: number;
  mortality: number;
  culled: number;
  feed_kg: number | null;
  water_liters: number | null;
  notes: string | null;
};

export type Transaction = {
  id: string;
  txn_date: string;
  txn_type: "income" | "expense";
  module: "dairy" | "layer" | "general";
  category: string;
  amount: number;
  description: string | null;
};

export type ActionState = { error?: string; success?: string } | null;
