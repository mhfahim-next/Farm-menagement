import { CommunityList, listMetadata } from "./community-list";

// Static: the newest questions, rebuilt at most every 10 minutes and whenever
// someone posts (community actions refresh it).
export const revalidate = 600;

export const generateMetadata = () => listMetadata({});

export default function CommunityPage() {
  return <CommunityList />;
}
