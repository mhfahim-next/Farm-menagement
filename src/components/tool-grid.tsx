import Link from "next/link";
import type { I18n } from "@/lib/i18n/core";
import { TOOLS, toolName, toolShort } from "@/lib/tool-list";

/** Cards linking to every tool (public list and the dashboard's Tools page). */
export function ToolGrid({ base, t }: { base: "/tools" | "/dashboard/tools"; t: I18n["t"] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TOOLS.map((tool) => (
        <li key={tool.slug}>
          <Link
            href={`${base}/${tool.slug}`}
            data-testid={`tool-link-${tool.slug}`}
            className="flex h-full gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow"
          >
            <span aria-hidden className="text-3xl leading-none">
              {tool.icon}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-stone-900">{t(toolName(tool.key))}</span>
              <span className="mt-0.5 block text-sm text-stone-500">{t(toolShort(tool.key))}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
