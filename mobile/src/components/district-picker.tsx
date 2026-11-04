import { useState } from "react";
import { ScrollView } from "react-native";
import { Button, Dialog, Portal, RadioButton } from "react-native-paper";
import { DISTRICTS, districtByKey } from "@/lib/districts";
import { usePrefs } from "@/lib/prefs";

/** A button showing the chosen district; tapping it opens the list of all 64. `allLabel` adds an "All districts" choice (value ""). */
export function DistrictPicker({ value, onChange, placeholder, allLabel, testID }: { value: string; onChange: (key: string) => void; placeholder: string; allLabel?: string; testID?: string }) {
  const { locale } = usePrefs();
  const [open, setOpen] = useState(false);
  const name = (key: string) => {
    const d = districtByKey(key);
    return d ? (locale === "bn" ? d.bn : d.en) : null;
  };
  const choices = [...(allLabel ? [{ key: "", label: allLabel }] : []), ...DISTRICTS.map((d) => ({ key: d.key, label: locale === "bn" ? d.bn : d.en }))];
  return (
    <>
      <Button mode="outlined" icon="map-marker-outline" onPress={() => setOpen(true)} testID={testID}>
        {name(value) ?? (value === "" && allLabel ? allLabel : placeholder)}
      </Button>
      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={{ maxHeight: "80%" }}>
          <Dialog.Title>{placeholder}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group
                value={value}
                onValueChange={(v) => {
                  onChange(v);
                  setOpen(false);
                }}
              >
                {choices.map((c) => (
                  <RadioButton.Item key={c.key || "all"} value={c.key} label={c.label} mode="android" testID={`district-${c.key || "all"}`} />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </>
  );
}
