// Where browsers send Content-Security-Policy violation reports (both the old
// report-uri format and the Reporting API). Each report is written to the
// server log as one short line, so a week of Report-Only shows what an
// enforced policy would block. Nothing is stored.

const MAX_BYTES = 16_000;

type Report = {
  "blocked-uri"?: string;
  blockedURL?: string;
  "violated-directive"?: string;
  effectiveDirective?: string;
  "document-uri"?: string;
  documentURL?: string;
  "source-file"?: string;
  sourceFile?: string;
};

const clip = (s: unknown) => (typeof s === "string" ? s.slice(0, 200) : "");

export async function POST(request: Request) {
  const text = (await request.text()).slice(0, MAX_BYTES);
  let reports: Report[] = [];
  try {
    const body = JSON.parse(text) as { "csp-report"?: Report } | { type?: string; body?: Report }[];
    reports = Array.isArray(body)
      ? body.filter((r) => r?.type === "csp-violation" && r.body).map((r) => r.body!)
      : body["csp-report"]
        ? [body["csp-report"]]
        : [];
  } catch {
    return new Response(null, { status: 204 });
  }
  for (const r of reports.slice(0, 10)) {
    const page = clip(r["document-uri"] ?? r.documentURL).replace(/\?.*$/, "");
    const file = clip(r["source-file"] ?? r.sourceFile);
    console.warn(`[csp] ${clip(r["violated-directive"] ?? r.effectiveDirective)} blocked ${clip(r["blocked-uri"] ?? r.blockedURL)} on ${page}${file ? ` (${file})` : ""}`);
  }
  return new Response(null, { status: 204 });
}
