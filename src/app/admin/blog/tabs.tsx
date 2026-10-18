import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

/** Articles / Categories & tags / Image library switcher on the admin blog pages. */
export async function BlogAdminTabs({ active }: { active: "posts" | "categories" | "media" }) {
  const { t } = await getI18n();
  const tabs = [
    { key: "posts", href: "/admin/blog", label: t("admin.blog.tabPosts") },
    { key: "categories", href: "/admin/blog/categories", label: t("admin.blog.tabCategories") },
    { key: "media", href: "/admin/blog/media", label: t("admin.blog.tabMedia") },
  ] as const;
  return (
    <nav aria-label={t("admin.blog.title")} className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-medium ${
            tab.key === active ? "bg-white text-emerald-800 shadow-sm" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
