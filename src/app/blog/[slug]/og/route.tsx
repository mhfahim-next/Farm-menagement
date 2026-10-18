import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";

/** Share image for an article without a cover photo: its English title on the brand background. */
export async function GET(_: Request, { params }: RouteContext<"/blog/[slug]/og">) {
  const { slug } = await params;
  const { data } = await createPublicClient()
    .from("blog_posts")
    .select("title_en, category:blog_categories(name_en)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  // The built-in font has no Bangla letters, so only the English title is drawn.
  const title = data?.title_en ?? "Farm management tips";
  const category = (data?.category as { name_en?: string } | null)?.name_en ?? "FarmFlows Blog";

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
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: 2 }}>
          {category}
        </div>
        <div style={{ display: "flex", fontSize: title.length > 70 ? 54 : 64, fontWeight: 800, lineHeight: 1.12, maxWidth: 1050 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
          farm<span style={{ color: "#16a34a" }}>flows</span>
          <span style={{ marginLeft: 16, color: "#166534", fontWeight: 400 }}>· farmflows.app/blog</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" },
    },
  );
}
