import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkParam, convertUnit, groupProblem, meatValue, mergeToolParams, mixFor, poultryFeed, pregnancyDates, tapeWeightKg, TOOL_DEFAULTS, TOOL_PARAM_SPEC } from "../../src/lib/tools.ts";

test("no stored rows: the defaults, nothing marked as changed", () => {
  const { params, custom } = mergeToolParams([]);
  assert.deepEqual(params, TOOL_DEFAULTS);
  assert.deepEqual(custom, {});
  assert.deepEqual(mergeToolParams(null).params, TOOL_DEFAULTS);
});

test("stored values override only what they name", () => {
  const { params, custom } = mergeToolParams([{ tool: "weight", params: { divisor: 9000 } }, { tool: "units", params: { bigha: 1618.744 } }]);
  assert.equal(params.weight.divisor, 9000);
  assert.equal(params.weight.spreadPct, 10);
  assert.equal(params.units.bigha, 1618.744);
  assert.deepEqual(custom, { weight: ["divisor"], units: ["bigha"] });
  assert.equal(tapeWeightKg(150, 120, "cm", params.weight)?.kg, 300); // 150² × 120 ÷ 9000
  assert.equal(convertUnit("land", 1, "bigha", "decimal", params.units), 40);
});

test("bad stored values are ignored: unknown tool or key, wrong type, out of range", () => {
  const { params, custom } = mergeToolParams([
    { tool: "nope", params: { divisor: 1 } },
    { tool: "weight", params: { divisor: 1, spreadPct: "5", extra: 3 } },
    { tool: "poultry", params: { layer: [10, -5], broiler: "x", sonali: Array(40).fill(10) } },
    { tool: "milk", params: null },
  ]);
  assert.deepEqual(params, TOOL_DEFAULTS);
  assert.deepEqual(custom, {});
});

test("a mix that doesn't add up to 100 %, or low above high, keeps the defaults", () => {
  const bad = mergeToolParams([{ tool: "mixDairy", params: { wheat_bran: 60 } }, { tool: "meat", params: { cattleLow: 60 } }]);
  assert.deepEqual(bad.params.mixDairy, TOOL_DEFAULTS.mixDairy);
  assert.deepEqual(bad.params.meat, TOOL_DEFAULTS.meat);
  const good = mergeToolParams([{ tool: "mixDairy", params: { wheat_bran: 35, maize: 30 } }]);
  assert.equal(good.params.mixDairy.maize, 30);
  assert.equal(mixFor("dairy", 100, {}, good.params).rows.find((r) => r.ingredient === "maize")?.kg, 30);
  assert.equal(groupProblem("mixDairy", { ...TOOL_DEFAULTS.mixDairy, salt: 5 }), "mixTotal");
});

test("feed tables, gestation and carcass share follow the params", () => {
  const { params } = mergeToolParams([
    { tool: "poultry", params: { broiler: [30, 60] } },
    { tool: "pregCattle", params: { gestation: 280 } },
    { tool: "meat", params: { goatLow: 40, goatHigh: 44 } },
  ]);
  assert.equal(poultryFeed("broiler", 1000, 30, {}, params.poultry)?.gPerBird, 60);
  assert.equal(pregnancyDates("cattle", "2026-01-01", "2026-01-01", undefined, params)?.due, "2026-10-08");
  assert.equal(meatValue("goat", 100, undefined, undefined, params.meat)?.carcassLow, 40);
});

test("every default fits its own range", () => {
  for (const group of Object.values(TOOL_PARAM_SPEC)) {
    for (const spec of Object.values(group)) assert.notEqual(checkParam(spec, spec.def), null);
  }
});
