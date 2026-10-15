"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FARM_COOKIE, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Switch the farm the dashboard shows (only farms the user belongs to). */
export async function switchFarm(farmId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("farm_members")
    .select("farm_id")
    .eq("user_id", user.id)
    .eq("farm_id", farmId)
    .maybeSingle();
  if (!data) return;

  (await cookies()).set(FARM_COOKIE, farmId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
