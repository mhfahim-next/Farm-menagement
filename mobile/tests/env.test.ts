import { errorDetail } from "@/lib/auth-errors";
import { cleanValue, supabaseOrigin } from "@/lib/env";

test("the Supabase address keeps only the project origin", () => {
  expect(supabaseOrigin("https://abc.supabase.co")).toBe("https://abc.supabase.co");
  expect(supabaseOrigin("https://abc.supabase.co/")).toBe("https://abc.supabase.co");
  expect(supabaseOrigin("https://abc.supabase.co/rest/v1/")).toBe("https://abc.supabase.co");
  expect(supabaseOrigin(' "https://abc.supabase.co/auth/v1" ')).toBe("https://abc.supabase.co");
  expect(supabaseOrigin("abc.supabase.co")).toBe("https://abc.supabase.co");
  expect(supabaseOrigin("")).toBe("");
  expect(supabaseOrigin(undefined)).toBe("");
});

test("pasted keys lose spaces and quotes", () => {
  expect(cleanValue("  'sb_publishable_x'\n")).toBe("sb_publishable_x");
  expect(cleanValue(undefined)).toBe("");
});

test("server wording is shown only for errors we don't explain", () => {
  expect(errorDetail({ message: "Invalid login credentials" })).toBeNull();
  expect(errorDetail({ status: 401, message: "Invalid API key" })).toBe("401 · Invalid API key");
  expect(errorDetail(null)).toBeNull();
});
