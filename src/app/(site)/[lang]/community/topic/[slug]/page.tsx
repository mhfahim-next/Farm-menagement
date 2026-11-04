import { CommunityList, listMetadata } from "../../community-list";

// One topic's newest questions: static, like /community.
export const revalidate = 600;

// Made on the first visit, then cached.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/community/topic/[slug]">) {
  return listMetadata({ topic: (await params).slug });
}

export default async function CommunityTopicPage({ params }: PageProps<"/[lang]/community/topic/[slug]">) {
  return <CommunityList topic={(await params).slug} />;
}
