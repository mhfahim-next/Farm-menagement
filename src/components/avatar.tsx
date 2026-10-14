/* eslint-disable @next/next/no-img-element -- avatars come from Supabase Storage and are tiny */

const colors = ["bg-emerald-600", "bg-sky-600", "bg-amber-600", "bg-rose-600", "bg-violet-600", "bg-teal-600"];

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name?.trim() || email?.split("@")[0] || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({
  url,
  name,
  email,
  size = 36,
}: {
  url?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  const seed = [...(email ?? name ?? "?")].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return (
    <span
      style={style}
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ${colors[seed % colors.length]}`}
      aria-hidden
    >
      {initials(name, email)}
    </span>
  );
}
