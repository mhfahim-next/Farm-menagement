import { strict as assert } from "node:assert";
import { test } from "node:test";
import { contentSecurityPolicy, securityHeaders } from "../../src/lib/security-headers.ts";

test("CSP allows our own site, Supabase (https + wss) and Sentry, and blocks framing and plugins", () => {
  const csp = contentSecurityPolicy({ supabaseUrl: "https://abc.supabase.co/", sentryDsn: "https://key@o1.ingest.sentry.io/2" });
  const d = Object.fromEntries(csp.split("; ").map((x) => [x.split(" ")[0], x.slice(x.indexOf(" ") + 1)]));
  assert.equal(d["default-src"], "'self'");
  assert.ok(d["connect-src"].includes("https://abc.supabase.co") && d["connect-src"].includes("wss://abc.supabase.co") && d["connect-src"].includes("https://o1.ingest.sentry.io"));
  assert.ok(d["img-src"].includes("https://abc.supabase.co"));
  assert.equal(d["frame-ancestors"], "'none'");
  assert.equal(d["object-src"], "'none'");
  assert.ok(!d["script-src"].includes("unsafe-eval"), "no eval in production");
  assert.ok(contentSecurityPolicy({ dev: true }).includes("'unsafe-eval'"));
  assert.ok(!contentSecurityPolicy({ supabaseUrl: "not a url" }).includes("not a url"));
});

test("Report-Only until enforced; frame and permission headers always", () => {
  const keys = (enforce: boolean) => securityHeaders({ enforce }).map((h) => h.key);
  assert.ok(keys(false).includes("Content-Security-Policy-Report-Only") && !keys(false).includes("Content-Security-Policy"));
  assert.ok(keys(true).includes("Content-Security-Policy"));
  const h = Object.fromEntries(securityHeaders().map((x) => [x.key, x.value]));
  assert.equal(h["X-Frame-Options"], "DENY");
  assert.ok(h["Permissions-Policy"].includes("camera=()") && h["Permissions-Policy"].includes("microphone=(self)"));
});
