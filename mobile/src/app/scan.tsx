import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { FormError } from "@/components/form-error";
import { FormScreen } from "@/components/form-screen";
import { useAnimals } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { findAnimal } from "@/lib/scan";
import { useSession } from "@/lib/session";

/** Point the camera at an ear tag's QR code (or type the tag number) to open the animal. */
export default function Scan() {
  const { t } = usePrefs();
  const theme = useTheme();
  const farm = useSession().current?.farm;
  const { data: animals } = useAnimals(farm?.id);
  const [permission, requestPermission] = useCameraPermissions();
  const [tag, setTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);
  const camera = Platform.OS !== "web";

  const open = (text: string) => {
    const hit = findAnimal(text, animals ?? []);
    if (!hit) {
      setError(t("scan.notFound", { tag: text.length > 40 ? `${text.slice(0, 40)}…` : text }));
      return false;
    }
    router.replace({ pathname: "/animal/[id]", params: { id: hit.id } });
    return true;
  };

  return (
    <FormScreen title={t("scan.title")} testID="scan">
      {camera &&
        (permission?.granted ? (
          <View style={[styles.cameraBox, { borderColor: theme.colors.primary }]}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => {
                if (handled.current) return;
                handled.current = open(data);
                // Let the next code through after a wrong one.
                if (!handled.current) setTimeout(() => (handled.current = false), 1500);
              }}
            />
          </View>
        ) : (
          <View style={[styles.cameraBox, styles.ask, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodyLarge" style={styles.center}>
              {t("scan.needCamera")}
            </Text>
            <Button mode="contained" icon="camera" onPress={requestPermission} testID="scan-allow">
              {t("scan.allow")}
            </Button>
          </View>
        ))}
      {camera && (
        <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
          {t("scan.hint")}
        </Text>
      )}
      <TextInput
        mode="outlined"
        label={t("scan.typeTag")}
        value={tag}
        onChangeText={(v) => {
          setTag(v);
          setError(null);
        }}
        autoCapitalize="characters"
        onSubmitEditing={() => open(tag)}
        left={<TextInput.Icon icon="tag-outline" />}
        testID="scan-tag"
      />
      <FormError message={error} />
      <Button mode="contained-tonal" icon="magnify" onPress={() => open(tag)} disabled={!tag.trim()} testID="scan-open">
        {t("scan.open")}
      </Button>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  cameraBox: { width: "100%", aspectRatio: 1, borderRadius: 24, overflow: "hidden", borderWidth: 3 },
  ask: { alignItems: "center", justifyContent: "center", gap: 16, padding: 24, borderWidth: 0 },
  center: { textAlign: "center" },
});
