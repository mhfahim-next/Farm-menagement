import { strict as assert } from "node:assert";
import { test } from "node:test";
import { isDynamicPath, isMissingFile, isSitePath, localePath, splitLocale } from "../../src/lib/i18n/paths.ts";

test("public pages get /bn in Bangla and no prefix in English", () => {
  assert.equal(localePath("/", "bn"), "/bn");
  assert.equal(localePath("/", "en"), "/");
  assert.equal(localePath("/blog/my-post?x=1#top", "bn"), "/bn/blog/my-post?x=1#top");
  assert.equal(localePath("/bn/blog", "en"), "/blog");
  assert.equal(localePath("/bn/blog", "bn"), "/bn/blog");
  assert.equal(localePath("/en/tools", "en"), "/tools");
  assert.equal(localePath("/doctor/signup", "bn"), "/bn/doctor/signup");
  assert.equal(localePath("/login", "bn"), "/bn/login");
});

test("app pages, files and other sites keep one address", () => {
  for (const href of ["/dashboard", "/dashboard/cattle/1", "/admin", "/doctor", "/doctor/profile", "/api/csp-report", "/auth/confirm", "/sitemap.xml", "/icons/icon-512.png", "/opengraph-image", "https://example.com/x", "//evil.com", "#faq", "mailto:a@b.c"]) {
    assert.equal(localePath(href, "bn"), href, href);
  }
  assert.equal(isSitePath("/dashboard"), false);
  assert.equal(isSitePath("/community/q/123"), true);
});

test("splitLocale reads the language prefix only as a whole segment", () => {
  assert.deepEqual(splitLocale("/bn"), { locale: "bn", path: "/" });
  assert.deepEqual(splitLocale("/bn/blog/x"), { locale: "bn", path: "/blog/x" });
  assert.deepEqual(splitLocale("/en/blog"), { locale: "en", path: "/blog" });
  assert.deepEqual(splitLocale("/bnx/blog"), { locale: null, path: "/bnx/blog" });
  assert.deepEqual(splitLocale("/blog"), { locale: null, path: "/blog" });
});

test("addresses that look like files but are not ours go to the 404 page", () => {
  for (const p of ["/xyz.a", "/abc.df", "/x.y.z", "/blog/x.y", "/community/q/a.b"]) assert.equal(isMissingFile(p), true, p);
  for (const p of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt", "/sw.js", "/icons/icon-192.png", "/brand/logo.svg", "/api/x.json", "/dashboard/a.b", "/blog", "/"]) assert.equal(isMissingFile(p), false, p);
});

test("pages made per request are prefetched on intent only", () => {
  for (const p of ["/login", "/bn/signup", "/doctor/signup", "/community/ask", "/community/list?q=x", "/blog/search?q=x", "/dashboard", "/dashboard/cattle/1", "/admin"]) assert.equal(isDynamicPath(p), true, p);
  for (const p of ["/", "/bn", "/blog", "/bn/blog/x", "/tools/cattle-weight", "/community", "/community/q/1", "https://x.org", "#a"]) assert.equal(isDynamicPath(p), false, p);
});
