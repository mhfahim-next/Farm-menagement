import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { clientKeys, render } from "../../scripts/client-keys.mjs";

test("the list of translation keys sent to the browser is up to date (npm run i18n:client-keys)", () => {
  const file = readFileSync(new URL("../../src/lib/i18n/client-keys.ts", import.meta.url), "utf8");
  assert.equal(file, render(clientKeys()));
});
