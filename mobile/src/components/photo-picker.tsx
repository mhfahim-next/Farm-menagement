import { Image, StyleSheet, View } from "react-native";
import { Button, Icon, useTheme } from "react-native-paper";
import { usePrefs } from "@/lib/prefs";
import { pickPhoto, type PhotoSource } from "@/lib/photos";

/** A photo with "Camera" and "Gallery" buttons (and "Remove" when there is one). */
export function PhotoPicker({ uri, onPick, onRemove, round }: { uri: string | null; onPick: (uri: string) => void; onRemove?: () => void; round?: boolean }) {
  const theme = useTheme();
  const { t } = usePrefs();
  const pick = async (s: PhotoSource) => {
    const u = await pickPhoto(s).catch(() => null);
    if (u) onPick(u);
  };
  return (
    <View style={styles.row}>
      <View style={[round ? styles.round : styles.box, { backgroundColor: theme.colors.surfaceVariant }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" testID="photo-preview" /> : <Icon source={round ? "account" : "cow"} size={36} color={theme.colors.outline} />}
      </View>
      <View style={styles.buttons}>
        <Button mode="contained-tonal" icon="camera" compact onPress={() => pick("camera")} testID="photo-camera">
          {t("photo.camera")}
        </Button>
        <Button mode="outlined" icon="image" compact onPress={() => pick("library")} testID="photo-library">
          {t("photo.library")}
        </Button>
        {uri && onRemove ? (
          <Button mode="text" icon="delete-outline" compact textColor={theme.colors.error} onPress={onRemove} testID="photo-remove">
            {t("photo.remove")}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16, alignItems: "center" },
  box: { width: 120, height: 90, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  round: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  buttons: { flex: 1, gap: 6, alignItems: "flex-start" },
});
