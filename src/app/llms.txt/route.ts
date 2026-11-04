// /llms.txt: a short guide to the site for AI assistants (llmstxt.org).
// Built once at build time and served as a static file.
export const dynamic = "force-static";

const BODY = `# FarmFlows

> Free farm management app for dairy, cattle, goat and layer-poultry farms in Bangladesh. Records for milk, eggs, vaccines, breeding, feed stock, sales and profit. Works in Bangla and English, on phone or computer.

## Product
- [Farm management software](https://www.farmflows.app/farm-management-software): what the app tracks and how to choose farm software
- [About FarmFlows](https://www.farmflows.app/about): who we are and who it is for
- [Contact](https://www.farmflows.app/contact): support@farmflows.app

## Free tools
- [All farm tools](https://www.farmflows.app/tools): free calculators for farmers
- [Cattle and goat weight from tape](https://www.farmflows.app/tools/cattle-weight)
- [Feed ration](https://www.farmflows.app/tools/feed-ration)
- [Calving date](https://www.farmflows.app/tools/calving-date)
- [Qurbani animal price](https://www.farmflows.app/tools/qurbani-price)

## Guides
- [Blog](https://www.farmflows.app/blog): practical guides on feeding, vaccines, breeding, milk and egg records
- [Cattle vaccination schedule in Bangladesh](https://www.farmflows.app/blog/cattle-vaccination-schedule-bangladesh)
- [How to measure cattle weight with a tape](https://www.farmflows.app/blog/how-to-measure-cattle-weight-with-a-tape)

## Bangla
- [বাংলা সংস্করণ](https://www.farmflows.app/bn): all pages are also available in Bangla under /bn/
`;

export function GET() {
  return new Response(BODY, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
