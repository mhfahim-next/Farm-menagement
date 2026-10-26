import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { currencyFor, pickCurrency, priceFor, receiptCode } from "../../src/lib/payments.ts";
import { stripeSignatureOk } from "../../src/lib/stripe-signature.ts";
import type { Plan } from "../../src/lib/plan-utils.ts";

const pro = { key: "pro", price_monthly: 999, price_monthly_usd: 9 } as Plan;

test("currency: taka in Bangladesh (and locally), dollars elsewhere, ?cur= wins", () => {
  assert.equal(currencyFor("BD"), "BDT");
  assert.equal(currencyFor(null), "BDT");
  assert.equal(currencyFor("US"), "USD");
  assert.equal(pickCurrency("BD", "usd"), "USD");
  assert.equal(pickCurrency("IN", "nonsense"), "USD");
});

test("price: months × monthly price minus the discount; taka rounded, dollars to cents", () => {
  assert.equal(priceFor(pro, 1, 0, "BDT"), 999);
  assert.equal(priceFor(pro, 3, 5, "BDT"), 2847);
  assert.equal(priceFor(pro, 12, 15, "BDT"), 10190);
  assert.equal(priceFor(pro, 3, 5, "USD"), 25.65);
  assert.equal(priceFor({ ...pro, price_monthly_usd: null }, 1, 0, "USD"), null);
});

test("receipt numbers", () => assert.equal(receiptCode(42), "FF-000042"));

test("stripe webhook signature: right secret and fresh only", () => {
  const body = '{"id":"evt_1"}';
  const now = 1_800_000_000_000;
  const t = Math.floor(now / 1000);
  const sig = (secret: string, ts = t) => `t=${ts},v1=${createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex")}`;
  assert.equal(stripeSignatureOk(body, sig("whsec_a"), "whsec_a", now), true);
  assert.equal(stripeSignatureOk(body, sig("whsec_b"), "whsec_a", now), false);
  assert.equal(stripeSignatureOk(body + " ", sig("whsec_a"), "whsec_a", now), false);
  assert.equal(stripeSignatureOk(body, sig("whsec_a", t - 600), "whsec_a", now), false);
  assert.equal(stripeSignatureOk(body, null, "whsec_a", now), false);
  assert.equal(stripeSignatureOk(body, "t=abc,v1=00", "whsec_a", now), false);
});
