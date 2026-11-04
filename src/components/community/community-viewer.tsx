"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useViewer, type Viewer } from "../viewer";
import { CommunityImagePicker } from "./image-picker";

/**
 * The signed-in member's side of a question page, worked out in the browser so
 * the page itself can be the same cached HTML for everyone: are they an admin
 * or blocked from posting, and which posts on this question they marked helpful.
 */
type Me = { viewer: Viewer; isAdmin: boolean; banned: boolean; votes: Set<string> };

// questionId → undefined (loading) | null (visitor) | Me
const store = new Map<string, Me | null>();
const loading = new Set<string>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

async function load(questionId: string, viewer: Viewer) {
  const supabase = createClient();
  const [{ data: p }, { data: votes }] = await Promise.all([
    supabase.from("profiles").select("is_super_admin, community_banned").eq("id", viewer.id).maybeSingle(),
    supabase.from("community_votes").select("target_id").eq("user_id", viewer.id).limit(5000),
  ]);
  store.set(questionId, {
    viewer,
    isAdmin: !!p?.is_super_admin,
    banned: !!p?.community_banned,
    votes: new Set((votes ?? []).map((v) => v.target_id as string)),
  });
  notify();
}

/** undefined while loading, null for visitors. */
export function useCommunityMe(questionId: string): Me | null | undefined {
  const viewer = useViewer();
  const me = useSyncExternalStore(subscribe, () => store.get(questionId), () => undefined);
  useEffect(() => {
    if (!viewer || store.has(questionId) || loading.has(questionId)) return;
    loading.add(questionId);
    load(questionId, viewer).catch(() => loading.delete(questionId));
  }, [viewer, questionId]);
  if (viewer === null) return null;
  return me;
}

/**
 * Shows its children only to the members a post control is for:
 * "other" = signed in and not the author (report), "manage" = the author or an
 * admin (edit/delete), "asker" = whoever asked the question or an admin (best answer).
 */
export function CommunityGate({ questionId, need, authorId, children }: { questionId: string; need: "other" | "manage" | "asker"; authorId: string; children: ReactNode }) {
  const me = useCommunityMe(questionId);
  if (!me) return null;
  const isAuthor = me.viewer.id === authorId;
  const ok = need === "other" ? !isAuthor : isAuthor || me.isAdmin;
  return ok ? <>{children}</> : null;
}

/** Edit / delete tools: the author can edit, an admin can only remove. */
export function useIsAuthor(questionId: string, authorId: string) {
  const me = useCommunityMe(questionId);
  return !!me && me.viewer.id === authorId;
}

/** The "your answer" box: log in, blocked, closed, or the form. */
export function AnswerGate({
  questionId,
  open,
  guest,
  banned,
  closed,
  form,
}: {
  questionId: string;
  open: boolean;
  guest: ReactNode;
  banned: ReactNode;
  closed: ReactNode;
  form: ReactNode;
}) {
  const me = useCommunityMe(questionId);
  if (!me) return <>{guest}</>;
  if (me.banned) return <>{banned}</>;
  if (!open) return <>{closed}</>;
  return <>{form}</>;
}

/** Photo picker for the signed-in member (uploads go to their own folder). */
export function MemberImagePicker() {
  const viewer = useViewer();
  return viewer ? <CommunityImagePicker userId={viewer.id} /> : null;
}
