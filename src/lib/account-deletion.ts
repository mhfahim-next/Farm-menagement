import "server-only";
// Deleting accounts whose 30 days are up (and those an admin deletes at once).
// Runs with the service key: from the daily job (src/app/api/cron/deletions)
// and from "Delete now" in /admin/deletions. The database deletes the account
// and its farms first (delete_account_now, which also refuses when someone
// else now uses one of their farms); then the files are removed from storage
// (photos can't be removed from the database side).
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient } from "@/lib/supabase/service";

type Bucket = "animal-photos" | "avatars";

/** Every file in one folder of a bucket (paged), as full paths. */
async function filesIn(db: SupabaseClient, bucket: Bucket, folder: string) {
  const paths: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from(bucket).list(folder, { limit: 1000, offset });
    if (error || !data?.length) break;
    paths.push(...data.filter((f) => f.id).map((f) => `${folder}/${f.name}`));
    if (data.length < 1000) break;
  }
  return paths;
}

async function removeFolder(db: SupabaseClient, bucket: Bucket, folder: string) {
  const paths = await filesIn(db, bucket, folder);
  for (let i = 0; i < paths.length; i += 100) await db.storage.from(bucket).remove(paths.slice(i, i + 100));
}

export type DeletionRun = { deleted: number; blocked: number; failed: number };

/** Deletes the requests that are due (or just `only`); `by` says who asked for it now. */
export async function runDueDeletions(by: "schedule" | "admin", only?: string): Promise<DeletionRun | { error: string }> {
  const db = serviceClient();
  if (!db) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };
  let q = db.from("account_deletion_requests").select("id, user_id").eq("status", "pending").lte("delete_after", new Date().toISOString()).limit(200);
  if (only) q = q.eq("id", only);
  const { data, error } = await q;
  if (error) return { error: error.message };
  const run: DeletionRun = { deleted: 0, blocked: 0, failed: 0 };
  for (const r of (data ?? []) as { id: string; user_id: string | null }[]) {
    // Their farms, read before they are deleted (their photos are in a folder per farm).
    const farms = r.user_id ? ((await db.from("farms").select("id").eq("owner_id", r.user_id)).data ?? []).map((f) => f.id as string) : [];
    const { data: outcome, error: e } = await db.rpc("delete_account_now", { p_request: r.id, p_by: by });
    if (e) {
      run.failed++;
      continue;
    }
    if (outcome === "blocked") {
      run.blocked++;
      continue;
    }
    if (outcome !== "deleted") continue;
    run.deleted++;
    if (r.user_id) await removeFolder(db, "avatars", r.user_id).catch(() => {});
    for (const f of farms) await removeFolder(db, "animal-photos", f).catch(() => {});
  }
  return run;
}
