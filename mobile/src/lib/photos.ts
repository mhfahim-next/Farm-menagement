// Photos of animals and of the person: taken or chosen on the phone, made
// small (1024 px, JPEG) and stored in Supabase Storage.
import { Directory, File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
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

/**
 * Uploads to <folder>/<name>.jpg in the bucket (a random name unless given)
 * and returns the stored path. A given name is overwritten when sent again.
 */
export async function uploadPhoto(bucket: "animal-photos" | "avatars", folder: string, uri: string, name?: string) {
  const body = await (await fetch(uri)).arrayBuffer();
  const path = `${folder}/${name ?? uuid()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: "image/jpeg", upsert: Boolean(name) });
  if (error) throw new Error(error.message);
  return path;
}

/**
 * A photo waiting to be uploaded is copied out of the picker's temporary
 * folder (which the phone may empty) into the app's own files.
 */
export function keepPhoto(uri: string) {
  if (Platform.OS === "web") return uri;
  try {
    const dir = new Directory(Paths.document, "outbox");
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const dest = new File(dir, `${uuid()}.jpg`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

/** Deletes a kept photo once it is uploaded (or the entry is discarded). */
export function dropKeptPhoto(uri: string | null | undefined) {
  if (!uri || Platform.OS === "web" || !uri.includes("/outbox/")) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // already gone
  }
}

/** A photo still waiting on the phone is shown from there. */
const local = (path: string) => /^(file|data|blob|content):/.test(path);

export const photoUrl = (bucket: "animal-photos" | "avatars", path: string | null | undefined) =>
  path ? (local(path) ? path : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl) : null;

export async function removePhoto(bucket: "animal-photos" | "avatars", path: string | null | undefined) {
  if (path && !local(path)) await supabase.storage.from(bucket).remove([path]).catch(() => {});
}
