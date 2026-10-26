import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";

/** Sends each person to where they belong: guide, sign-in, farm setup or the app. */
export default function Index() {
  const s = useSession();
  if (!s.introSeen) return <Redirect href="/intro" />;
  if (!s.session) return <Redirect href="/login" />;
  if (s.memberships.length === 0) return <Redirect href="/onboarding/farm" />;
  if (s.planPending) return <Redirect href="/onboarding/plan" />;
  return <Redirect href="/home" />;
}
