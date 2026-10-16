import { Fragment, type ReactNode } from "react";

/**
 * A small, safe Markdown renderer for blog posts. It builds React elements
 * (never raw HTML), so article text can't inject scripts or markup.
 *
 * Supports: # / ## / ### headings, paragraphs, - and 1. lists, > quotes,
 * --- rules, | tables |, **bold**, *italic*, `code` and [links](url).
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function safeHref(href: string) {
  return /^(https?:\/\/|mailto:|\/(?!\/))/i.test(href) ? href : null;
}

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key} className="font-semibold text-stone-900">{inline(part.slice(2, -2), key)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key} className="rounded bg-stone-100 px-1.5 py-0.5 text-[0.9em] text-stone-800">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{inline(part.slice(1, -1), key)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      return href ? (
        <a key={key} href={href} className="text-emerald-700 underline hover:text-emerald-800" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {link[1]}
        </a>
      ) : (
        <Fragment key={key}>{link[1]}</Fragment>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

const isTableRow = (l: string) => l.trim().startsWith("|") && l.trim().endsWith("|");
const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes("-");
const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${k++}`;

    if (!line.trim()) {
      i++;
      continue;
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      out.push(
        level === 3 ? (
          <h3 key={key} className="mb-2 mt-6 text-lg font-semibold text-stone-900">{inline(h[2], key)}</h3>
        ) : (
          <h2 key={key} className="mb-3 mt-9 text-2xl font-bold tracking-tight text-stone-900">{inline(h[2], key)}</h2>
        ),
      );
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push(<hr key={key} className="my-8 border-stone-200" />);
      i++;
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      out.push(
        <div key={key} className="my-5 overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="bg-stone-50">
              <tr>
                {head.map((c, ci) => (
                  <th key={ci} className="px-3 py-2 font-semibold text-stone-800">{inline(c, `${key}h${ci}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 text-stone-700">{inline(c, `${key}r${ri}c${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      out.push(
        <blockquote key={key} className="my-5 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-stone-700">
          {inline(quote.join(" "), key)}
        </blockquote>,
      );
      continue;
    }

    const ul = /^\s*[-*]\s+/.test(line);
    const ol = /^\s*\d+[.)]\s+/.test(line);
    if (ul || ol) {
      const re = ul ? /^\s*[-*]\s+(.*)$/ : /^\s*\d+[.)]\s+(.*)$/;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) items.push(re.exec(lines[i++])![1]);
      const Tag = ul ? "ul" : "ol";
      out.push(
        <Tag key={key} className={`my-4 space-y-1.5 pl-6 ${ul ? "list-disc" : "list-decimal"} marker:text-emerald-700`}>
          {items.map((it, ii) => (
            <li key={ii}>{inline(it, `${key}i${ii}`)}</li>
          ))}
        </Tag>,
      );
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|\s*>|\s*[-*]\s+|\s*\d+[.)]\s+|\s*-{3,}\s*$)/.test(lines[i]) &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      para.push(lines[i++]);
    }
    out.push(
      <p key={key} className="my-4 leading-8 text-stone-700">
        {inline(para.join(" "), key)}
      </p>,
    );
  }

  return <div className="text-base">{out}</div>;
}
