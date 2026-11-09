import { strict as assert } from "node:assert";
import { test } from "node:test";
import { pickPromo, promoHref, splitArticle, todayBd, validPromoUrl, type Promo } from "../../src/lib/promos.ts";

const box = (id: string, x: Partial<Promo> = {}): Promo => ({
  id, kind: "house", sponsor_name: null, title_en: id, title_bn: id, body_en: null, body_bn: null, cta_en: "Go", cta_bn: "যান",
  url: "/signup", image_path: null, placements: ["blog_mid"], categories: [], starts_on: null, ends_on: null, priority: 0, active: true, ...x,
});
const day = "2026-11-09";

test("promos: only switched-on boxes for the place, inside their dates", () => {
  const list = [
    box("a", { active: false }),
    box("b", { placements: ["community_list"] }),
    box("c", { starts_on: "2026-11-10" }),
    box("d", { ends_on: "2026-11-08" }),
  ];
  assert.equal(pickPromo(list, "blog_mid", { key: "x", today: day }), null);
  assert.equal(pickPromo([...list, box("e", { starts_on: day, ends_on: day })], "blog_mid", { key: "x", today: day })?.id, "e");
});

test("promos: category boxes only on their categories, and they beat general ones", () => {
  const list = [box("general"), box("vacc", { categories: ["cattle-health"] })];
  assert.equal(pickPromo(list, "blog_mid", { key: "x", category: "cattle-health", today: day })?.id, "vacc");
  assert.equal(pickPromo(list, "blog_mid", { key: "x", category: "poultry", today: day })?.id, "general");
  assert.equal(pickPromo(list, "blog_mid", { key: "x", category: null, today: day })?.id, "general");
  // Higher priority still wins over a category match.
  assert.equal(pickPromo([...list, box("big", { priority: 5 })], "blog_mid", { key: "x", category: "cattle-health", today: day })?.id, "big");
  // Categories do not apply on community pages.
  assert.equal(pickPromo([box("c", { placements: ["community_list"], categories: ["poultry"] })], "community_list", { key: "x", today: day })?.id, "c");
});

test("promos: a box already on the page is not shown again", () => {
  const list = [box("a", { placements: ["blog_mid", "blog_end"], priority: 5 }), box("b", { placements: ["blog_end"] })];
  assert.equal(pickPromo(list, "blog_end", { key: "x", today: day })?.id, "a");
  assert.equal(pickPromo(list, "blog_end", { key: "x", today: day, exclude: ["a"] })?.id, "b");
});

test("promos: no sponsor boxes on health articles", () => {
  const list = [box("s", { kind: "sponsor", sponsor_name: "Feed Co", priority: 9 }), box("own")];
  assert.equal(pickPromo(list, "blog_mid", { key: "x", health: true, today: day })?.id, "own");
  assert.equal(pickPromo(list, "blog_mid", { key: "x", health: false, today: day })?.id, "s");
  assert.equal(pickPromo([list[0]], "blog_mid", { key: "x", health: true, today: day }), null);
});

test("promos: equal boxes are shared out by page, and each page keeps its box", () => {
  const list = [box("a"), box("b"), box("c")];
  const seen = new Set(Array.from({ length: 40 }, (_, i) => pickPromo(list, "blog_mid", { key: `post-${i}`, today: day })?.id));
  assert.equal(seen.size, 3);
  const one = pickPromo(list, "blog_mid", { key: "post-7", today: day })?.id;
  assert.equal(pickPromo([...list].reverse(), "blog_mid", { key: "post-7", today: day })?.id, one);
});

test("promos: links", () => {
  for (const ok of ["/", "/signup", "/tools/ration?x=1", "https://example.com", "https://shop.example.com.bd/feed"]) assert.ok(validPromoUrl(ok), ok);
  for (const bad of ["", "//evil.com", "http://example.com", "javascript:alert(1)", "https://", "/a b", "signup"]) assert.ok(!validPromoUrl(bad), bad);
  assert.equal(promoHref({ id: "abc" }, "bn"), "/api/promo/abc?l=bn");
  assert.equal(promoHref({ id: "abc" }, "en"), "/api/promo/abc");
});

test("promos: article split at the heading nearest the middle", () => {
  const para = "Words here. ".repeat(60); // ~720 characters
  const body = ["Intro " + para, "## One", para, "## Two", para, "## Three", para, "## Four", para].join("\n\n");
  const parts = splitArticle(body);
  assert.ok(parts);
  assert.equal((parts[0] + parts[1]).replace(/\s/g, ""), body.replace(/\s/g, "")); // nothing lost
  assert.ok(parts[1].startsWith("## "));
  assert.ok(Math.abs(parts[0].length - body.length / 2) < body.length / 4);
  assert.equal(splitArticle("short"), null);
  assert.equal(splitArticle(para.repeat(5)), null); // no heading
  // A heading inside a code block is not a split point.
  assert.equal(splitArticle(para.repeat(2) + "\n```\n## not a heading\n```\n" + para.repeat(2)), null);
});

test("promos: Bangladesh day", () => {
  assert.equal(todayBd(new Date("2026-11-09T18:30:00Z")), "2026-11-10");
  assert.equal(todayBd(new Date("2026-11-09T17:59:00Z")), "2026-11-09");
});
