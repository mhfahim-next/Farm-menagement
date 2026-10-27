import { useCallback } from "react";
import type { Animal } from "./data";
import { farmToday } from "./dates";
import { ageParts, optionLabel, type OptionRow } from "./options";
import { usePrefs } from "./prefs";

/** "Cow · Holstein Friesian · 4 y 2 m" for an animal row. */
export function useDescribe(options: OptionRow[] | null) {
  const { t, locale } = usePrefs();
  return useCallback(
    (a: Animal) => {
      const age = ageParts(a.date_of_birth, farmToday());
      const ageText = !age ? "" : age.y ? `${t("age.y", { n: age.y })}${age.m ? ` ${t("age.m", { n: age.m })}` : ""}` : age.m ? t("age.m", { n: age.m }) : t("age.d", { n: age.d });
      return [optionLabel(options, "cattle_category", a.category, locale), a.breed ? optionLabel(options, "cattle_breed", a.breed, locale) : "", ageText].filter(Boolean).join(" · ");
    },
    [options, t, locale],
  );
}
