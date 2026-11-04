"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserMenu } from "./user-menu";

/**
 * Who is looking at a public page, found out in the browser. Public pages are
 * the same static HTML for everyone (cached on the CDN), so the parts that
 * differ for a signed-in person — "Dashboard" instead of "Sign up", the
 * avatar menu — are filled in here after the page loads. Visitors without a
 * Supabase session cookie cost nothing: no request is made.
 */
export type Viewer = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  isDoctor: boolean;
  /** Where "Dashboard" goes: doctors have their own console. */
  home: "/dashboard" | "/doctor";
};

// undefined = not known yet (also during server rendering), null = visitor.
let current: Viewer | null | undefined = undefined;
let started = false;
const listeners = new Set<() => void>();

function set(v: Viewer | null) {
  current = v;
  listeners.forEach((l) => l());
}

function hasSessionCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith("sb-") && c.includes("-auth-token"));
}

function start() {
  if (started) return;
  started = true;
  if (!hasSessionCookie()) return set(null);
  const supabase = createClient();
  // getUser() checks the session with the auth server (a revoked session is a visitor).
  supabase.auth
    .getUser()
    .then(async ({ data: { user } }) => {
      if (!user) return set(null);
      const { data: p } = await supabase.from("profiles").select("full_name, avatar_url, is_super_admin, account_type").eq("id", user.id).maybeSingle();
      const isDoctor = p?.account_type === "doctor";
      set({
        id: user.id,
        name: p?.full_name ?? null,
        email: user.email ?? null,
        avatarUrl: p?.avatar_url ?? null,
        isSuperAdmin: !!p?.is_super_admin,
        isDoctor,
        home: isDoctor ? "/doctor" : "/dashboard",
      });
    })
    .catch(() => set(null));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The signed-in person, null for visitors, undefined until known (first render shows the visitor version). */
export function useViewer() {
  const v = useSyncExternalStore(subscribe, () => current, () => undefined);
  useEffect(start, []);
  return v;
}

/**
 * Shows `guest` to visitors (and in the static HTML), `member` to signed-in
 * farmers and `doctor` (default: `member`) to vets.
 */
export function ForViewer({ guest = null, member = null, doctor }: { guest?: ReactNode; member?: ReactNode; doctor?: ReactNode }) {
  const v = useViewer();
  if (!v) return <>{guest}</>;
  return <>{v.isDoctor && doctor !== undefined ? doctor : member}</>;
}

/** The avatar menu, for signed-in people only. */
export function ViewerMenu() {
  const v = useViewer();
  if (!v) return null;
  return <UserMenu user={{ name: v.name, email: v.email, avatarUrl: v.avatarUrl, isSuperAdmin: v.isSuperAdmin, isDoctor: v.isDoctor }} />;
}
