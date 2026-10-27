import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Checkbox, Chip, HelperText, List, Searchbar, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import type { Animal } from "@/lib/data";
import { farmToday } from "@/lib/dates";
import { addDays, isDate } from "@/lib/records";
import { usePrefs } from "@/lib/prefs";

/** A small heading above a group of fields. */
export function Label({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
      {children}
    </Text>
  );
}

/** Pick one (or several) from chips that wrap onto more lines. */
export function ChoiceChips({
  options,
  value,
  onChange,
  testID,
}: {
  options: { value: string; label: string; icon?: string }[];
  value: string | string[];
  onChange: (v: string) => void;
  testID?: string;
}) {
  const chosen = Array.isArray(value) ? value : [value];
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip key={o.value} selected={chosen.includes(o.value)} showSelectedCheck icon={o.icon} onPress={() => onChange(o.value)} testID={testID ? `${testID}-${o.value}` : undefined}>
          {o.label}
        </Chip>
      ))}
    </View>
  );
}

/** A date: today / yesterday in one tap, or typed as YYYY-MM-DD. */
export function DateField({ value, onChange, label, optional, testID }: { value: string; onChange: (v: string) => void; label?: string; optional?: boolean; testID?: string }) {
  const { t, date } = usePrefs();
  const today = farmToday();
  const quick = [today, addDays(today, -1)];
  const [typing, setTyping] = useState(!quick.includes(value) && !(optional && !value));
  return (
    <View style={styles.gap}>
      <Label>{label ?? t("rec.date")}</Label>
      <View style={styles.chips} testID={testID}>
        {optional && (
          <Chip selected={!typing && !value} showSelectedCheck onPress={() => (setTyping(false), onChange(""))} testID="date-none">
            {t("rec.notKnown")}
          </Chip>
        )}
        <Chip selected={!typing && value === today} showSelectedCheck onPress={() => (setTyping(false), onChange(today))} testID="date-today">
          {t("entry.today")}
        </Chip>
        <Chip selected={!typing && value === quick[1]} showSelectedCheck onPress={() => (setTyping(false), onChange(quick[1]))} testID="date-yesterday">
          {t("entry.yesterday")}
        </Chip>
        <Chip selected={typing} showSelectedCheck icon="calendar" onPress={() => setTyping(true)} testID="date-other">
          {typing && isDate(value) ? date(value) : t("rec.otherDate")}
        </Chip>
      </View>
      {typing && (
        <>
          <TextInput mode="outlined" dense value={value} onChangeText={onChange} placeholder="2026-10-27" keyboardType="numbers-and-punctuation" maxLength={10} testID="date-input" />
          <HelperText type={value && !isDate(value) ? "error" : "info"} visible>
            {value && !isDate(value) ? t("rec.err.date") : t("rec.dateHint")}
          </HelperText>
        </>
      )}
    </View>
  );
}

const isGoat = (a: Pick<Animal, "species">) => a.species === "goat" || a.species === "sheep";

/** Choose animals from a searchable list (one, or several with "select all"). */
export function AnimalPicker({
  animals,
  selected,
  onChange,
  multi,
  describe,
}: {
  animals: Animal[];
  selected: string[];
  onChange: (ids: string[]) => void;
  multi: boolean;
  describe: (a: Animal) => string;
}) {
  const { t } = usePrefs();
  const theme = useTheme();
  const [q, setQ] = useState("");
  const both = animals.some(isGoat) && animals.some((a) => !isGoat(a));
  const [group, setGroup] = useState<"cattle" | "goats">(() => (animals.find((a) => selected.includes(a.id)) && isGoat(animals.find((a) => selected.includes(a.id))!) ? "goats" : "cattle"));
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return animals.filter((a) => (!both || (group === "goats") === isGoat(a)) && (!n || a.tag_number.toLowerCase().includes(n) || (a.name ?? "").toLowerCase().includes(n)));
  }, [animals, q, group, both]);
  const toggle = (id: string) => onChange(multi ? (selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]) : [id]);
  const allOn = list.length > 0 && list.every((a) => selected.includes(a.id));

  return (
    <View style={styles.gap}>
      {both && (
        <SegmentedButtons
          value={group}
          onValueChange={(v) => setGroup(v as "cattle" | "goats")}
          density="small"
          buttons={[
            { value: "cattle", label: t("animals.cattle"), icon: "cow", testID: "pick-cattle" },
            { value: "goats", label: t("animals.goats"), icon: "sheep", testID: "pick-goats" },
          ]}
        />
      )}
      <Searchbar placeholder={t("animals.search")} value={q} onChangeText={setQ} mode="bar" style={styles.search} inputStyle={styles.searchInput} testID="pick-search" />
      {multi && list.length > 1 && (
        <Checkbox.Item
          label={t("rec.selectAll", { n: list.length })}
          status={allOn ? "checked" : "unchecked"}
          onPress={() => onChange(allOn ? selected.filter((id) => !list.some((a) => a.id === id)) : [...new Set([...selected, ...list.map((a) => a.id)])])}
          position="leading"
          labelStyle={styles.left}
          testID="pick-all"
        />
      )}
      <ScrollView style={[styles.pickList, { borderColor: theme.colors.outlineVariant }]} nestedScrollEnabled>
        {list.length === 0 ? (
          <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>{t("animals.empty")}</Text>
        ) : (
          list.map((a) => (
            <List.Item
              key={a.id}
              title={`#${a.tag_number}${a.name ? ` · ${a.name}` : ""}`}
              description={describe(a)}
              onPress={() => toggle(a.id)}
              left={() => (
                <View style={styles.check}>
                  {multi ? (
                    <Checkbox.Android status={selected.includes(a.id) ? "checked" : "unchecked"} onPress={() => toggle(a.id)} />
                  ) : (
                    <List.Icon icon={selected.includes(a.id) ? "radiobox-marked" : "radiobox-blank"} color={theme.colors.primary} />
                  )}
                </View>
              )}
              style={selected.includes(a.id) ? { backgroundColor: theme.colors.secondaryContainer } : undefined}
              testID={`pick-${a.tag_number}`}
            />
          ))
        )}
      </ScrollView>
      {multi && (
        <Text variant="labelMedium" style={{ color: theme.colors.primary }} testID="pick-count">
          {t("rec.chosen", { n: selected.length })}
        </Text>
      )}
    </View>
  );
}

/** A number box (Bangla digits are fine). */
export function NumberField({ label, value, onChange, affix, testID, icon }: { label: string; value: string; onChange: (v: string) => void; affix?: string; testID?: string; icon?: string }) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChange}
      keyboardType="decimal-pad"
      left={icon ? <TextInput.Icon icon={icon} /> : undefined}
      right={affix ? <TextInput.Affix text={affix} /> : undefined}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gap: { gap: 8 },
  search: { height: 48 },
  searchInput: { minHeight: 0 },
  left: { textAlign: "left" },
  pickList: { maxHeight: 320, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16 },
  check: { justifyContent: "center", paddingLeft: 8 },
  empty: { padding: 16, textAlign: "center" },
});
