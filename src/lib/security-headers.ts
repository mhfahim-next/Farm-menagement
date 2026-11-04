// Security headers for every page (next.config.ts → headers()).
//
// The Content-Security-Policy has no nonces, so public pages can stay static:
// Next.js and our JSON-LD use inline scripts, which 'unsafe-inline' allows,
// while scripts from any other site, plugins, framing and form posts elsewhere
// are blocked. It is sent as Content-Security-Policy-Report-Only first, so
// nothing breaks while reports (to /api/csp-report) show what it would block;
// CSP_ENFORCE=1 switches it on for real.

/** Origin of a URL from the environment ("https://x.supabase.co/" → "https://x.supabase.co"), or null. */
function originOf(raw: string | undefined) {
  if (!raw) return null;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

export function contentSecurityPolicy(env: { supabaseUrl?: string; sentryDsn?: string; dev?: boolean } = {}) {
  const supabase = originOf(env.supabaseUrl);
  const supabaseWs = supabase ? supabase.replace(/^http/, "ws") : null;
  const sentry = originOf(env.sentryDsn);
  const list = (...xs: (string | null | false | undefined)[]) => xs.filter(Boolean).join(" ");
  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": list("'self'", "'unsafe-inline'", env.dev && "'unsafe-eval'"),
    "style-src": "'self' 'unsafe-inline'",
    // Photos come from Supabase Storage; Google sign-in photos from googleusercontent; previews are blob:/data:.
    "img-src": list("'self'", "data:", "blob:", supabase, "https://*.googleusercontent.com"),
    "font-src": "'self' data:",
    "connect-src": list("'self'", supabase, supabaseWs, sentry, env.dev && "ws:"),
    "media-src": "'self' blob:",
    "worker-src": "'self' blob:",
    "manifest-src": "'self'",
    "frame-src": "'self'",
    "object-src": "'none'",
    "base-uri": "'self'",
    // Payment pages are reached by redirects, not form posts; the gateways are allowed in case one posts back.
    "form-action": "'self' https://securepay.sslcommerz.com https://sandbox.sslcommerz.com https://checkout.stripe.com",
    "frame-ancestors": "'none'",
    "report-uri": "/api/csp-report",
    "report-to": "csp",
  };
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v}`)
    .join("; ");
}

/** Headers for every route. */
export function securityHeaders(env: { supabaseUrl?: string; sentryDsn?: string; dev?: boolean; enforce?: boolean } = {}) {
  return [
    { key: env.enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", value: contentSecurityPolicy(env) },
    { key: "Reporting-Endpoints", value: 'csp="/api/csp-report"' },
    { key: "X-Frame-Options", value: "DENY" },
    // The website's AI assistant can use the microphone (speech to text) on our own pages only.
    { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];
}
