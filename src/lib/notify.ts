import "server-only";
// Sending reminders: phone / browser notifications (Web Push) and email (Resend).
// Keys come from the environment only:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto: or https: address)
//   RESEND_API_KEY, REMINDER_EMAIL_FROM (e.g. "FarmFlows <reminders@farmflows.app>"),
//   RESEND_API_URL (optional, another endpoint with the same API)
// Either channel is simply off while its keys are missing.
import webpush from "web-push";
import { SITE_URL } from "@/lib/site";

const env = (k: string) => process.env[k]?.trim() || null;

export function pushReady() {
  return Boolean(env("NEXT_PUBLIC_VAPID_PUBLIC_KEY") && env("VAPID_PRIVATE_KEY"));
}

export function emailReady() {
  return Boolean(env("RESEND_API_KEY"));
}

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

/**
 * Browsers' push services (Chrome / Android / Samsung / Opera: FCM, Safari / iPhone:
 * Apple, Firefox: Mozilla, Edge: Windows). Anything else is refused, so a made-up
 * subscription can't make the server call other addresses. PUSH_EXTRA_HOSTS
 * (comma-separated host names) adds more, e.g. for testing.
 */
const PUSH_HOSTS = [/(^|\.)googleapis\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)mozilla\.com$/, /(^|\.)mozaws\.net$/, /(^|\.)notify\.windows\.com$/];
export function pushHostAllowed(endpoint: string) {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const extra = (env("PUSH_EXTRA_HOSTS") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  return extra.includes(url.hostname) || PUSH_HOSTS.some((re) => re.test(url.hostname));
}
export type PushMessage = { title: string; body: string; url: string; tag?: string };

/**
 * Sends one notification to one browser. "gone" means the browser dropped the
 * subscription (uninstalled, permission removed): delete it.
 */
export async function sendPush(target: PushTarget, msg: PushMessage): Promise<"ok" | "gone" | "error"> {
  const pub = env("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const priv = env("VAPID_PRIVATE_KEY");
  if (!pub || !priv) return "error";
  if (!pushHostAllowed(target.endpoint)) return "gone";
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(msg),
      {
        vapidDetails: { subject: env("VAPID_SUBJECT") ?? SITE_URL, publicKey: pub, privateKey: priv },
        TTL: 12 * 3600,
        urgency: "normal",
        topic: msg.tag?.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined,
        timeout: 15_000,
      },
    );
    return "ok";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    console.error("Push failed:", status ?? (e as Error).message);
    return "error";
  }
}

export async function sendEmail(p: { to: string; subject: string; html: string; text: string }) {
  const key = env("RESEND_API_KEY");
  if (!key) return false;
  try {
    const res = await fetch(env("RESEND_API_URL") ?? "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env("REMINDER_EMAIL_FROM") ?? "FarmFlows <reminders@farmflows.app>",
        to: [p.to],
        subject: p.subject,
        html: p.html,
        text: p.text,
        headers: { "List-Unsubscribe": `<${new URL("/dashboard/notifications", SITE_URL)}>` },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) console.error("Email failed:", res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error("Email failed:", (e as Error).message);
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type DigestSection = { farm: string; items: { title: string; when: string; url: string; tone: "red" | "amber" | "blue" }[] };

/** The email summary: one block per farm, each reminder a link into the app. */
export function digestEmail(p: { heading: string; intro: string; sections: DigestSection[]; button: string; footer: string; lang: string }) {
  const color = { red: "#b91c1c", amber: "#b45309", blue: "#1d4ed8" };
  const blocks = p.sections
    .map(
      (s) => `<h2 style="font-size:16px;margin:24px 0 8px;color:#1c1917">${esc(s.farm)}</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${s.items
        .map(
          (i) => `<tr><td style="padding:10px 0;border-top:1px solid #e7e5e4"><a href="${esc(i.url)}" style="color:#1c1917;text-decoration:none;font-weight:600">${esc(i.title)}</a></td>
<td style="padding:10px 0 10px 12px;border-top:1px solid #e7e5e4;text-align:right;white-space:nowrap;color:${color[i.tone]};font-size:13px">${esc(i.when)}</td></tr>`,
        )
        .join("")}</table>`,
    )
    .join("");
  const home = new URL("/dashboard/notifications", SITE_URL).toString();
  const html = `<!doctype html><html lang="${p.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f4;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#047857;color:#fff;border-radius:14px 14px 0 0;padding:20px 24px"><strong style="font-size:18px">FarmFlows</strong>
<p style="margin:6px 0 0;font-size:20px;font-weight:700">${esc(p.heading)}</p></div>
<div style="background:#fff;border-radius:0 0 14px 14px;padding:8px 24px 24px">
<p style="color:#57534e;line-height:1.5">${esc(p.intro)}</p>${blocks}
<p style="margin:28px 0 0"><a href="${home}" style="background:#047857;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">${esc(p.button)}</a></p>
</div><p style="color:#78716c;font-size:12px;line-height:1.5;padding:16px 8px">${esc(p.footer)}</p></div></body></html>`;
  const text = [p.heading, "", p.intro, "", ...p.sections.flatMap((s) => [s.farm, ...s.items.map((i) => `- ${i.title} (${i.when}) ${i.url}`), ""]), home, "", p.footer].join("\n");
  return { html, text };
}
