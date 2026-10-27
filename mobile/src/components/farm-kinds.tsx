import { StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";
import { FARM_KINDS, KIND_ICON, type FarmKind } from "@/lib/farm";
import { usePrefs } from "@/lib/prefs";

/** What the farm keeps: dairy, fattening, goats & sheep, layers, broilers (one or more). */
export function FarmKinds({ value, onChange }: { value: Record<FarmKind, boolean>; onChange: (v: Record<FarmKind, boolean>) => void }) {
  const { t } = usePrefs();
  return (
    <View style={styles.row}>
      {FARM_KINDS.map((k) => (
        <Chip key={k} icon={KIND_ICON[k]} selected={value[k]} showSelectedCheck onPress={() => onChange({ ...value, [k]: !value[k] })} testID={`kind-${k}`}>
          {t(`kind.${k}`)}
        </Chip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", flexWrap: "wrap", gap: 8 } });
