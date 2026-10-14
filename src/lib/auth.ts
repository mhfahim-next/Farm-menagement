import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
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
  if (!data?.farms) redirect("/onboarding");

  return {
    supabase,
    user,
    farm: data.farms as unknown as Farm,
    role: data.role as Role,
  };
});
