/* FarmFlows service worker.
 *
 *  - immutable build assets and icons are cached (cache-first);
 *  - page navigations go to the network; offline, a small bilingual
 *    "no connection" page is shown, with a link to quick entry;
 *  - the one exception is the quick-entry page (/dashboard/quick): a copy is
 *    kept so daily entries can be made without internet. That copy holds the
 *    farm's animal / flock / staff names, so it is deleted on sign-out;
 *  - API and Supabase responses are never cached;
 *  - reminder notifications (Web Push) are shown, and tapping one opens
 *    the page it is about (an open FarmFlows window is reused).
 */
const VERSION = "v4";
const CACHE = `farmflow-static-${VERSION}`;
const PAGES = "farmflow-pages-v1";
const QUICK = "/dashboard/quick";
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
<button onclick="location.reload()">Retry · আবার চেষ্টা করুন</button>
<p style="margin-top:20px"><a href="/dashboard/quick" style="color:#047857;font-weight:600">Quick entry works offline · দ্রুত এন্ট্রি অফলাইনে চলে</a></p></div></body></html>`;

/** Keeps a copy of the quick-entry page and the build files it loads. */
async function keepQuickPage(res) {
  if (!res.ok || res.redirected || new URL(res.url).pathname !== QUICK) return;
  const html = await res.clone().text();
  const pages = await caches.open(PAGES);
  await pages.put(QUICK, res.clone());
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
  const cache = await caches.open(CACHE);
  await Promise.all(
    assets.map(async (a) => {
      if (await cache.match(a)) return;
      try {
        const r = await fetch(a);
        if (r.ok) await cache.put(a, r);
      } catch {}
    }),
  );
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "warm-offline") {
    event.waitUntil(
      fetch(QUICK, { credentials: "same-origin" })
        .then(keepQuickPage)
        .catch(() => {}),
    );
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Signing out: forget the saved quick-entry page (it lists the farm's animals and staff).
  if (req.method === "POST" && url.pathname === "/auth/signout") {
    event.waitUntil(caches.delete(PAGES));
    return;
  }
  if (req.method !== "GET") return;

  if (req.mode === "navigate" && url.pathname === QUICK) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          event.waitUntil(keepQuickPage(res).catch(() => {}));
          return res;
        })
        .catch(async () => {
          const saved = await caches.match(QUICK, { cacheName: PAGES });
          return saved || new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
        }),
    );
    return;
  }

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

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const url = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/dashboard/notifications";
  event.waitUntil(
    self.registration.showNotification(data.title || "FarmFlows", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "farmflows",
      renotify: Boolean(data.tag),
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/dashboard/notifications", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const win = wins.find((w) => new URL(w.url).origin === self.location.origin);
      if (win) return win.navigate(url).then((w) => (w || win).focus()).catch(() => win.focus());
      return self.clients.openWindow(url);
    }),
  );
});
