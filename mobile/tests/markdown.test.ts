import { inline, parseMarkdown, readingMinutes } from "../src/lib/markdown";

const P = "https://x.supabase.co/storage/v1/object/public/blog-images/";

test("blocks: headings, lists, quote, rule, table, paragraph", () => {
  const md = ["## Feeding", "", "Give **clean** water.", "", "- one", "- two", "", "1. first", "2. second", "", "> Call a vet", "", "---", "", "| A | B |", "| --- | --- |", "| 1 | 2 |", "", "### Small"].join("\n");
  const b = parseMarkdown(md, P);
  expect(b.map((x) => x.type)).toEqual(["h2", "p", "ul", "ol", "quote", "hr", "table", "h3"]);
  expect(b[1]).toEqual({ type: "p", spans: [{ text: "Give " }, { text: "clean", bold: true }, { text: " water." }] });
  expect(b[2]).toEqual({ type: "ul", items: [[{ text: "one" }], [{ text: "two" }]] });
  const table = b[6] as Extract<(typeof b)[number], { type: "table" }>;
  expect(table.head.map((c) => c[0].text)).toEqual(["A", "B"]);
  expect(table.rows[0].map((c) => c[0].text)).toEqual(["1", "2"]);
});

test("only library images are shown; unsafe links become plain text", () => {
  const b = parseMarkdown([`![cow](${P}cow.webp "A cow")`, "![x](https://evil.example/x.png)", "[ok](/tools) [bad](javascript:alert(1))"].join("\n\n"), P);
  expect(b[0]).toEqual({ type: "img", src: `${P}cow.webp`, alt: "cow", caption: "A cow" });
  expect(b).toHaveLength(2);
  expect(inline("[ok](/tools)")).toEqual([{ text: "ok", href: "/tools" }]);
  expect(inline("*it* `c`")).toEqual([{ text: "it", italic: true }, { text: " " }, { text: "c", code: true }]);
  expect(inline("[bad](javascript:x)")).toEqual([{ text: "bad" }]);
  expect(readingMinutes("word ".repeat(450))).toBe(2);
});
