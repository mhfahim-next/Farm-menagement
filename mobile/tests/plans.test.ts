import { authErrorKey, isEmail } from "@/lib/auth-errors";
import type { Plan } from "@/lib/farm";
import { limitLines, monthlyPrice, planName, popularKey } from "@/lib/plans";

const plan = (key: string, price: number, x: Partial<Plan> = {}): Plan => ({
  key, name_en: key.toUpperCase(), name_bn: null, price_monthly: price, price_monthly_usd: price ? price / 110 : 0,
  max_cattle: 10, max_goats: 30, max_flocks: 2, max_members: 2, max_farms: 1, can_export: false, priority_support: false, max_ai_prompts: 0, sort_order: 0, ...x,
});

test("plan price in the farm's currency, name in the reader's language", () => {
  const pro = plan("pro", 990, { price_monthly_usd: 9, name_bn: "প্রো" });
  expect(monthlyPrice(pro, "BDT")).toBe(990);
  expect(monthlyPrice(pro, "USD")).toBe(9);
  expect(monthlyPrice(plan("x", 990, { price_monthly_usd: null }), "USD")).toBeNull();
  expect(planName(pro, "bn")).toBe("প্রো");
  expect(planName(plan("free", 0), "bn")).toBe("FREE");
});

test("limits: a number, or unlimited when empty", () => {
  const lines = limitLines(plan("biz", 2490, { max_cattle: null, max_farms: 3 }));
  expect(lines[0]).toEqual({ key: "plan.cattleAll" });
  expect(lines[4]).toEqual({ key: "plan.farms", n: 3 });
});

test("the cheapest paid plan is highlighted", () => {
  expect(popularKey([plan("free", 0), plan("business", 2490), plan("pro", 990)])).toBe("pro");
  expect(popularKey([plan("free", 0)])).toBeNull();
});

test("sign-in errors in plain words", () => {
  expect(authErrorKey({ message: "Invalid login credentials" })).toBe("auth.err.invalid");
  expect(authErrorKey({ code: "email_not_confirmed", message: "" })).toBe("auth.err.notConfirmed");
  expect(authErrorKey({ code: "user_already_exists" })).toBe("auth.err.taken");
  expect(authErrorKey({ name: "AuthRetryableFetchError", message: "Failed to fetch" })).toBe("common.network");
  expect(authErrorKey({ message: "boom" })).toBe("common.error");
  expect(isEmail("farmer@example.com")).toBe(true);
  expect(isEmail("farmer@")).toBe(false);
});
