import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Farm, Role } from "@/lib/types";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  account_type: "farmer" | "doctor";
  doctor_reg_no: string | null;
  doctor_specialty: string | null;
  doctor_verified: boolean;
};

/**
 * Who is looking at a public page: the signed-in user and their profile, or null for visitors.
 * Visitors (no Supabase auth cookie) cost nothing; the check only runs when a cookie exists.
 */
export const getViewer = cache(async () => {
  const hasSession = (await cookies()).getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasSession) return null;
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user) return null;
  return {
    user,
    profile,
    /** Where "Dashboard" goes: doctors have their own console. */
    home: profile?.account_type === "doctor" ? "/doctor" : "/dashboard",
  };
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, is_super_admin, account_type, doctor_reg_no, doctor_specialty, doctor_verified")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

/**
 * Guards the /admin area. Anyone who isn't a super admin gets a 404 so the
 * area's existence isn't revealed. Every admin RPC re-checks this in Postgres.
 */
export async function requireSuperAdmin() {
  const user = await requireUser();
  const profile = await getProfile();
  if (!profile?.is_super_admin) notFound();
  return { user, profile, supabase: await createClient() };
}

export const FARM_COOKIE = "farm_id";

/** Roles by what they may do. Vets are read-mostly (health and breeding only). */
export const MANAGERS: Role[] = ["owner", "manager"];
export const STAFF: Role[] = ["owner", "manager", "worker"];

export type FarmSummary = {
  id: string;
  name: string;
  role: Role;
  plan: string;
  suspended: boolean;
};

export type FarmContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
  farm: Farm;
  role: Role;
  /** Every farm the user belongs to (for the farm switcher). */
  farms: FarmSummary[];
};

/**
 * Resolves the signed-in user's current farm: the one chosen in the farm
 * switcher (cookie) if they still belong to it, else their first active farm.
 * Every dashboard page and server action goes through here; RLS in Postgres is
 * the real guard, this just picks the tenant and redirects when there isn't one.
 */
export const requireFarm = cache(async (): Promise<FarmContext> => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("farm_members")
    .select("role, created_at, farms(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const memberships = (data ?? [])
    .filter((m) => m.farms)
    .map((m) => ({ role: m.role as Role, farm: m.farms as unknown as Farm }));

  if (memberships.length === 0) {
    const profile = await getProfile();
    if (profile?.is_super_admin) redirect("/admin");
    if (profile?.account_type === "doctor") redirect("/doctor");
    redirect("/onboarding");
  }

  const wanted = (await cookies()).get(FARM_COOKIE)?.value;
  const usable = memberships.filter((m) => !m.farm.suspended);
  const current = usable.find((m) => m.farm.id === wanted) ?? usable[0];
  if (!current) redirect("/suspended");

  return {
    supabase,
    user,
    farm: current.farm,
    role: current.role,
    farms: memberships.map((m) => ({
      id: m.farm.id,
      name: m.farm.name,
      role: m.role,
      plan: m.farm.plan,
      suspended: m.farm.suspended,
    })),
  };
});

/** Guards the doctor console: farmers are sent to their dashboard. */
export async function requireDoctor() {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile?.account_type !== "doctor") redirect("/dashboard");
  return { user, profile, supabase: await createClient() };
}

/** Like requireFarm, but 404s unless the user's role in the current farm is allowed. */
export async function requireRole(allowed: Role[]) {
  const ctx = await requireFarm();
  if (!allowed.includes(ctx.role)) notFound();
  return ctx;
}
