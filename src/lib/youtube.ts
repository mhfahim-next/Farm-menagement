// YouTube links for the home page's demo videos (safe in client and server code).

const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The video id from a YouTube link or a bare id, or null.
 * Accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID
 * (with or without www., m. or music.).
 */
export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (ID.test(s)) return s;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const [, kind, value] = url.pathname.split("/");
      if (["shorts", "embed", "live", "v"].includes(kind)) id = value ?? null;
    }
  }
  return id && ID.test(id) ? id : null;
}

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
/** Privacy-enhanced player: no YouTube cookies until the visitor plays. */
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
