import { CommunityList, listMetadata, type ListQuery } from "../community-list";

// Search, other orders and later pages: made per request, kept out of search engines.
const query = (sp: Record<string, string | string[] | undefined>): ListQuery => {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  return { topic: one("topic"), q: one("q"), sort: one("sort"), page: one("page") };
};

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/community/list">) {
  return listMetadata(query(await searchParams));
}

export default async function CommunityListPage({ searchParams }: PageProps<"/[lang]/community/list">) {
  return <CommunityList {...query(await searchParams)} />;
}
