// A small, safe Markdown parser for blog articles (same rules as the website's
// renderer, src/components/markdown.tsx): # / ## / ### headings, paragraphs,
// - and 1. lists, > quotes, --- rules, | tables |, **bold**, *italic*, `code`,
// [links](url) and images on their own line from the blog image library.
// It returns plain data; components/markdown.tsx draws it.

export type Span = { text: string; bold?: boolean; italic?: boolean; code?: boolean; href?: string };
export type Block =
  | { type: "h2" | "h3" | "p" | "quote"; spans: Span[] }
  | { type: "ul" | "ol"; items: Span[][] }
  | { type: "hr" }
  | { type: "img"; src: string; alt: string; caption: string }
  | { type: "table"; head: Span[][]; rows: Span[][][] };

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
const IMAGE_LINE = /^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;

/** Only http(s), mailto and site paths are links. */
export const safeHref = (href: string) => (/^(https?:\/\/|mailto:|\/(?!\/))/i.test(href) ? href : null);

export function inline(text: string, style: Omit<Span, "text"> = {}): Span[] {
  const out: Span[] = [];
  for (const part of text.split(INLINE)) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) out.push(...inline(part.slice(2, -2), { ...style, bold: true }));
    else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) out.push({ ...style, text: part.slice(1, -1), code: true });
    else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) out.push(...inline(part.slice(1, -1), { ...style, italic: true }));
    else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (link) {
        const href = safeHref(link[2]);
        out.push(href ? { ...style, text: link[1], href } : { ...style, text: link[1] });
      } else out.push({ ...style, text: part });
    }
  }
  return out;
}

const isTableRow = (l: string) => l.trim().startsWith("|") && l.trim().endsWith("|");
const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes("-");
const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => inline(c.trim()));

/** `imagePrefix`: only images under it (the blog library) are shown. */
export function parseMarkdown(source: string, imagePrefix: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const img = IMAGE_LINE.exec(line);
    if (img) {
      if (img[2].startsWith(imagePrefix) && !img[2].includes("..")) out.push({ type: "img", src: img[2], alt: img[1], caption: img[3] ?? "" });
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      out.push({ type: h[1].length === 3 ? "h3" : "h2", spans: inline(h[2]) });
      i++;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push({ type: "hr" });
      i++;
      continue;
    }
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: Span[][][] = [];
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      out.push({ type: "table", head, rows });
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      out.push({ type: "quote", spans: inline(quote.join(" ")) });
      continue;
    }
    const ul = /^\s*[-*]\s+/.test(line);
    const ol = /^\s*\d+[.)]\s+/.test(line);
    if (ul || ol) {
      const re = ul ? /^\s*[-*]\s+(.*)$/ : /^\s*\d+[.)]\s+(.*)$/;
      const items: Span[][] = [];
      while (i < lines.length && re.test(lines[i])) items.push(inline(re.exec(lines[i++])![1]));
      out.push({ type: ul ? "ul" : "ol", items });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|\s*>|\s*[-*]\s+|\s*\d+[.)]\s+|\s*-{3,}\s*$)/.test(lines[i]) &&
      !IMAGE_LINE.test(lines[i]) &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      para.push(lines[i++]);
    }
    out.push({ type: "p", spans: inline(para.join(" ")) });
  }
  return out;
}

/** Roughly how many minutes the text takes to read (200 words a minute), as on the website. */
export function readingMinutes(text: string) {
  const words = text.replace(/[#>*`|\-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
