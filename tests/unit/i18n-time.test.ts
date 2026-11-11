import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createI18n } from "../../src/lib/i18n/core.ts";

const { f } = createI18n("en", {} as never);

test("times are shown in Bangladesh time, whatever the server's time zone", () => {
  // 19:30 UTC on 10 Nov is 01:30 on 11 Nov in Dhaka.
  assert.match(f.dateTime("2026-11-10T19:30:00+00:00"), /^11\/11\/2026.*01:30/);
  assert.match(f.date("2026-11-10T19:30:00+00:00"), /^11\/11\/2026$/);
  assert.match(f.date("2026-11-10T05:00:00.123456+00:00"), /^10\/11\/2026$/);
});

test("dates are dd/mm/yyyy, in Bangla digits on Bangla pages", () => {
  assert.equal(createI18n("bn", {} as never).f.date("2026-11-09"), "০৯/১১/২০২৬");
  assert.match(f.date("2026-11-10"), /^10\/11\/2026$/);
  assert.equal(f.date(null), "—");
});
