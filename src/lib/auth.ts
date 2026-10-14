import "server-only";
import { cache } from "react";
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
};

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, avatar_url, is_super_admin")
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

export type FarmContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
  farm: Farm;
  role: Role;
};

/**
 * Resolves the signed-in user's farm. Every dashboard page and server
 * action goes through here; RLS in Postgres is the real guard, this just
 * picks the tenant and redirects when there isn't one yet.
 */
export const requireFarm = cache(async (): Promise<FarmContext> => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("farm_members")
    .select("role, farms(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.farms) {
    // A super admin without a farm of their own goes straight to the admin panel.
    const profile = await getProfile();
    redirect(profile?.is_super_admin ? "/admin" : "/onboarding");
  }

  const farm = data.farms as unknown as Farm;
  if (farm.suspended) redirect("/suspended");

  return { supabase, user, farm, role: data.role as Role };
});
