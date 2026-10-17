/* FarmFlows service worker.
 *
 * Keeps the app installable and fast without ever storing private data:
 *  - immutable build assets and icons are cached (cache-first);
 *  - page navigations always go to the network, and only when the phone is
 *    offline a small bilingual "no connection" page is shown;
 *  - pages, API and Supabase responses are never cached.
 */
const VERSION = "v2";
const CACHE = `farmflow-static-${VERSION}`;
const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png"];

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#16a34a"><title>FarmFlows</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fafaf9;color:#1c1917;font-family:system-ui,sans-serif;text-align:center;padding:24px}
.c{max-width:340px}.i{width:72px;height:72px;border-radius:18px;background:#047857;margin:0 auto 20px}
h1{font-size:20px;margin:0 0 6px}p{color:#57534e;margin:0 0 16px;line-height:1.5}
button{background:#047857;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:16px;font-weight:600}
@media(prefers-color-scheme:dark){body{background:#0c0a09;color:#f5f5f4}p{color:#a8a29e}}
</style></head><body><div class="c"><img class="i" src="/icons/icon-192.png" alt="">
<h1>You are offline</h1><p>Check your internet connection and try again.</p>
<h1>ইন্টারনেট নেই</h1><p>ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</p>
<button onclick="location.reload()">Retry · আবার চেষ্টা করুন</button></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(
        () => new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
