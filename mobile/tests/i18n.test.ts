import { bn } from "@/lib/i18n/bn";
import { formatMoney, formatNumber, localDigits, translate } from "@/lib/i18n/core";
import { en } from "@/lib/i18n/en";

test("every English text has a Bangla one, with the same {placeholders}", () => {
  const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    expect(bn[key]).toBeTruthy();
    expect(holes(bn[key])).toBe(holes(en[key]));
  }
});

test("numbers and money in Bangla digits", () => {
  expect(localDigits("2026", "bn")).toBe("২০২৬");
  expect(formatNumber(12550, "bn")).toBe("১২,৫৫০");
  expect(formatNumber(12550, "en")).toBe("12,550");
  expect(formatMoney(2847, "BDT", "bn")).toBe("৳২,৮৪৭");
  expect(formatMoney(9.5, "USD", "en")).toBe("$9.50");
});

test("placeholders are filled, numbers in the reader's digits", () => {
  expect(translate("bn", "plan.cattle", { n: 50 })).toBe("৫০টি গরু");
  expect(translate("en", "auth.checkEmailBody", { email: "a@b.co" })).toContain("a@b.co");
});

test("singular forms: 1 farm, 2 farms", () => {
  expect(translate("en", "plan.farms", { n: 1 })).toBe("1 farm");
  expect(translate("en", "plan.farms", { n: 3 })).toBe("3 farms");
  expect(translate("bn", "plan.farms", { n: 1 })).toBe("১টি খামার");
});
