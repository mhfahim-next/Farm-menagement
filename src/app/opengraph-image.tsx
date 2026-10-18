import { ImageResponse } from "next/og";

export const alt = "FarmFlows — dairy, cattle and layer farm management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share image for the site (Facebook, WhatsApp, X, LinkedIn). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #bbf7d0 100%)",
          color: "#14532d",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#22c55e" />
                <stop offset="1" stopColor="#15803d" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="url(#g)" />
            <path d="M21 48V27a13 13 0 0 1 13-13h12" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
            <path d="M21 33h15" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
            <circle cx="46" cy="33" r="4.5" fill="#d9f99d" />
          </svg>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#14532d" }}>
            farm<span style={{ color: "#16a34a" }}>flows</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.1, maxWidth: 980 }}>Run your whole farm from one simple dashboard</div>
          <div style={{ fontSize: 32, color: "#166534" }}>Milk · Eggs · Vaccines · Breeding · Staff · Profit — in Bangla & English</div>
        </div>
      </div>
    ),
    size,
  );
}
