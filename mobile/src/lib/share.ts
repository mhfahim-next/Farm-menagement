// Share a report as a PDF or a CSV file (WhatsApp, email, Drive…). On the web the file is downloaded.
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareCsv(name: string, text: string) {
  if (Platform.OS === "web") return download(name, new Blob([text], { type: "text/csv;charset=utf-8" }));
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: name, UTI: "public.comma-separated-values-text" });
}

export async function sharePdf(name: string, html: string) {
  if (Platform.OS === "web") return Print.printAsync({ html });
  const { uri } = await Print.printToFileAsync({ html });
  // Give the file a readable name before sharing it.
  const file = new File(uri);
  const named = new File(Paths.cache, name);
  if (named.exists) named.delete();
  file.move(named);
  await Sharing.shareAsync(named.uri, { mimeType: "application/pdf", dialogTitle: name, UTI: "com.adobe.pdf" });
}
