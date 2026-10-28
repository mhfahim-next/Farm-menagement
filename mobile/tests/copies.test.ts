/// <reference types="node" />
import { readFileSync } from "node:fs";
import { join } from "node:path";

// These files are copied from the website so the app shows the same numbers.
// This test fails when one side changes without the other.
const COPIES = ["fattening", "broiler", "staff", "profit", "animal-profit", "tools"];

test.each(COPIES)("src/lib/%s.ts matches the website's copy", (name) => {
  const app = readFileSync(join(__dirname, "..", "src", "lib", `${name}.ts`), "utf8");
  const web = readFileSync(join(__dirname, "..", "..", "src", "lib", `${name}.ts`), "utf8");
  expect(app.split("\n").slice(1).join("\n")).toBe(web);
});
