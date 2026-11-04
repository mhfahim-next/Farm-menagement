import { strict as assert } from "node:assert";
import { test } from "node:test";
import { fitDescription } from "../../src/lib/site.ts";

test("meta descriptions are 120-155 characters: short text gets the extra sentence, long text is cut at a word", () => {
  const short = fitDescription("Cattle health", "Practical guides for dairy, cattle, goat and poultry farmers in Bangla and English, from FarmFlows.");
  assert.ok(short.length >= 100 && short.length <= 155 && short.startsWith("Cattle health. Practical"), short);
  const long = fitDescription("word ".repeat(80), "x");
  assert.ok(long.length <= 155 && long.endsWith("word…"), long);
  const ok = "a".repeat(130);
  assert.equal(fitDescription(ok, "extra"), ok);
  assert.ok(fitDescription("প্রশ্ন।", "উত্তর পড়ুন।").startsWith("প্রশ্ন। উত্তর"));
});
