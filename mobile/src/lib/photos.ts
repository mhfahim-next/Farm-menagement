// Photos of animals and of the person: taken or chosen on the phone, made
// small (1024 px, JPEG) and stored in Supabase Storage.
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";
import { uuid } from "./records";

export type PhotoSource = "camera" | "library";

/** The chosen photo, ready to upload; null when cancelled or not allowed. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  const perm = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
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
