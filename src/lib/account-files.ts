import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
type Bucket = "animal-photos" | "avatars";

/** Every file in one folder of a bucket (paged), as full paths. */
async function filesIn(supabase: Client, bucket: Bucket, folder: string) {
  const paths: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000, offset });
    if (error || !data?.length) break;
    paths.push(...data.filter((f) => f.id).map((f) => `${folder}/${f.name}`));
    if (data.length < 1000) break;
  }
  return paths;
}

/**
 * Before an account is deleted: removes the person's profile photos and the
 * animal photos of the farms that are deleted with it. Files can't be removed
 * from the database side, so this runs first, as the signed-in person.
 * Returns the names of farms that block the deletion because other people use
 * them; nothing is removed then.
 */
export async function removeAccountFiles(supabase: Client, userId: string) {
  const { data: farms } = await supabase.from("farms").select("id, name").eq("owner_id", userId);
  const owned = (farms ?? []) as { id: string; name: string }[];
  if (owned.length) {
    const { data: others } = await supabase.from("farm_members").select("farm_id").in("farm_id", owned.map((f) => f.id)).neq("user_id", userId);
    const shared = owned.filter((f) => (others ?? []).some((m) => m.farm_id === f.id)).map((f) => f.name);
    if (shared.length) return { shared };
  }
  const avatars = await filesIn(supabase, "avatars", userId);
  if (avatars.length) await supabase.storage.from("avatars").remove(avatars);
  for (const f of owned) {
    const photos = await filesIn(supabase, "animal-photos", f.id);
    for (let i = 0; i < photos.length; i += 100) await supabase.storage.from("animal-photos").remove(photos.slice(i, i + 100));
  }
  return { shared: [] as string[] };
}
