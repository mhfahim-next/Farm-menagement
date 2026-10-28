// Photos of animals and of the person: taken or chosen on the phone, made
// small (1024 px, JPEG) and stored in Supabase Storage.
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";
import { uuid } from "./records";

export type PhotoSource = "camera" | "library";

/** The chosen photo, ready to upload; null when cancelled or not allowed. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  // The system photo picker needs no permission (and the app doesn't ask for the
  // photo library, which Google Play only allows for gallery-type apps); the camera does.
  if (source === "camera" && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return null;
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [4, 3], quality: 0.9 };
  const res = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const uri = res.canceled ? null : res.assets[0]?.uri;
  if (!uri) return null;
  const small = await manipulateAsync(uri, [{ resize: { width: 1024 } }], { compress: 0.7, format: SaveFormat.JPEG });
  return small.uri;
}

/** Uploads to <folder>/<random>.jpg in the bucket and returns the stored path. */
export async function uploadPhoto(bucket: "animal-photos" | "avatars", folder: string, uri: string) {
  const body = await (await fetch(uri)).arrayBuffer();
  const path = `${folder}/${uuid()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export const photoUrl = (bucket: "animal-photos" | "avatars", path: string | null | undefined) =>
  path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;

export async function removePhoto(bucket: "animal-photos" | "avatars", path: string | null | undefined) {
  if (path) await supabase.storage.from(bucket).remove([path]).catch(() => {});
}

/** Every file in one folder of a bucket (paged), as full paths. */
async function filesIn(bucket: "animal-photos" | "avatars", folder: string) {
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
 * animal photos of the farms that will be deleted with it (files can't be
 * removed from the database side). Returns the names of farms that block the
 * deletion because other people use them; nothing is removed then.
 */
export async function removeAccountFiles(userId: string) {
  const { data: farms } = await supabase.from("farms").select("id, name").eq("owner_id", userId);
  const owned = (farms ?? []) as { id: string; name: string }[];
  if (owned.length) {
    const { data: others } = await supabase.from("farm_members").select("farm_id").in("farm_id", owned.map((f) => f.id)).neq("user_id", userId);
    const shared = owned.filter((f) => (others ?? []).some((m) => m.farm_id === f.id)).map((f) => f.name);
    if (shared.length) return { shared };
  }
  const avatars = await filesIn("avatars", userId);
  if (avatars.length) await supabase.storage.from("avatars").remove(avatars).catch(() => {});
  for (const f of owned) {
    const photos = await filesIn("animal-photos", f.id);
    for (let i = 0; i < photos.length; i += 100) await supabase.storage.from("animal-photos").remove(photos.slice(i, i + 100)).catch(() => {});
  }
  return { shared: [] as string[] };
}
