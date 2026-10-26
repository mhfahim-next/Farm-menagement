import type { I18n } from "@/lib/i18n/core";
import { FARM_KINDS, type FarmKind, type FarmKinds } from "@/lib/modules";

const ICON: Record<FarmKind, string> = {
  has_dairy: "🐄",
  has_fattening: "🐂",
  has_goat: "🐐",
  has_layer: "🥚",
  has_broiler: "🐔",
};

/** "What do you keep?" checkboxes: decides which pages the farm sees. */
export function FarmKindFields({ t, farm, compact = false }: { t: I18n["t"]; farm?: FarmKinds; compact?: boolean }) {
  // A new farm starts with cattle & dairy and layers ticked, as before.
  const checked = (k: FarmKind) => (farm ? Boolean(farm[k]) : k === "has_dairy" || k === "has_layer");
  return (
    <fieldset className="grid gap-2" data-testid="farm-kinds">
      <legend className="mb-1.5 text-sm font-medium text-stone-700">{t("onboarding.farmTypeLegend")}</legend>
      <div className={compact ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}>
        {FARM_KINDS.map((k) => (
          <label
            key={k}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
          >
            <input type="checkbox" name={k} defaultChecked={checked(k)} className="mt-1 accent-emerald-700" />
            <span aria-hidden className="text-xl leading-none">
              {ICON[k]}
            </span>
            <span>
              <span className="block text-sm font-medium">{t(`farmkind.${k}.title`)}</span>
              <span className="block text-xs text-stone-500">{t(`farmkind.${k}.body`)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Reads the five checkboxes from a submitted form. */
export function readFarmKinds(fd: FormData) {
  return Object.fromEntries(FARM_KINDS.map((k) => [k, fd.get(k) === "on"])) as Record<FarmKind, boolean>;
}
