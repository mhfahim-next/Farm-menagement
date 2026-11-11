import { strict as assert } from "node:assert";
import { test } from "node:test";
import { dmyToIso, isoToDmy, typingDmy } from "../../src/lib/date-text.ts";

test("dd/mm/yyyy ↔ ISO", () => {
  assert.equal(isoToDmy("2026-11-09"), "09/11/2026");
  assert.equal(isoToDmy(""), "");
  assert.equal(isoToDmy(null), "");
  assert.equal(dmyToIso("09/11/2026"), "2026-11-09");
  assert.equal(dmyToIso("9/1/2026"), "2026-01-09");
  assert.equal(dmyToIso("09-11-2026"), "2026-11-09");
  assert.equal(dmyToIso("০৯/১১/২০২৬"), "2026-11-09");
  assert.equal(dmyToIso("09112026"), "2026-11-09");
  assert.equal(dmyToIso("29/02/2028"), "2028-02-29");
});

test("not real dates", () => {
  for (const bad of ["", "31/02/2026", "29/02/2026", "00/10/2026", "10/13/2026", "1/1/26", "2026-11-09", "ab/cd/efgh", "32/01/2026"]) assert.equal(dmyToIso(bad), null, bad);
});

test("typing adds the slashes", () => {
  assert.equal(typingDmy("0"), "0");
  assert.equal(typingDmy("09"), "09/");
  assert.equal(typingDmy("09/1", "09/"), "09/1");
  assert.equal(typingDmy("09/11", "09/1"), "09/11/");
  assert.equal(typingDmy("09/11/2026", "09/11/202"), "09/11/2026");
  assert.equal(typingDmy("091120261", "09/11/2026"), "09/11/2026");
  assert.equal(typingDmy("০৯১১"), "09/11/");
  // Backspace over the slash removes it.
  assert.equal(typingDmy("09", "09/"), "09");
  // Own separators are kept.
  assert.equal(typingDmy("9/1/2026", "9/1/202"), "9/1/2026");
});

test("YouTube links", async () => {
  const { youtubeId } = await import("../../src/lib/youtube.ts");
  for (const ok of ["https://youtu.be/dQw4w9WgXcQ", "youtu.be/dQw4w9WgXcQ?si=abc", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s", "https://m.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"])
    assert.equal(youtubeId(ok), "dQw4w9WgXcQ", ok);
  for (const bad of ["", "https://vimeo.com/123", "https://youtube.com/watch?v=short", "https://evil.com/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://youtube.com/channel/UCabcdefghijk"])
    assert.equal(youtubeId(bad), null, bad);
});
