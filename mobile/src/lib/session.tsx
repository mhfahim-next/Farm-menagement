// Who is signed in, their farms and the farm they are working on. Everything
// is read with the person's own session, so the database's row-level security
// decides what they see (exactly as on the website).
import { isAuthRetryableFetchError, type Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Farm, Membership } from "./farm";
import { clearCache, readCache, writeCache } from "./cache";
import { getItem, KEYS, setItem } from "./storage";
import { onReconnect } from "./net";
import { supabase } from "./supabase";

type Profile = { full_name: string | null; account_type: "farmer" | "doctor"; avatar_url: string | null; phone: string | null };

type Account = { profile: Profile | null; memberships: Membership[] };

type SessionState = {
  ready: boolean;
  introSeen: boolean;
  finishIntro: () => void;
  session: Session | null;
  profile: Profile | null;
  memberships: Membership[];
  /** The farm being worked on (null until the person has one). */
  current: Membership | null;
  setCurrentFarm: (id: string) => void;
  /** Signing in just cancelled an account deletion request (shown once on Home). */
  restored: boolean;
  clearRestored: () => void;
  /** Set right after creating a farm, until a plan is chosen. */
  planPending: boolean;
  setPlanPending: (v: boolean) => void;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionState | null>(null);

const FARM_COLUMNS = "id, name, location, currency, plan, plan_expires_at, suspended, has_dairy, has_layer, has_goat, has_fattening, has_broiler, show_animal_profit";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [introSeen, setIntroSeen] = useState(() => getItem(KEYS.introSeen) === "1");
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  /** Profile and farms, and whose they are ("" = signed out). */
  const [data, setData] = useState<{ for: string; profile: Profile | null; memberships: Membership[] } | null>(null);
  const [farmId, setFarmId] = useState<string | null>(() => getItem(KEYS.farm));
  const [planPending, setPlanPendingState] = useState(() => getItem(KEYS.planPending) === "1");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let settled = false;
    // Without internet an expired sign-in can't be renewed, and Supabase keeps
    // trying for half a minute before it answers. The sign-in saved on the
    // phone is used meanwhile (and after, while the connection is down), so the
    // app opens offline; it is renewed by itself once the internet is back.
    const early = setTimeout(() => {
      const saved = storedSession();
      if (!settled && saved) {
        setSession(saved);
        setAuthReady(true);
      }
    }, 1500);
    supabase.auth
      .getSession()
      .then(({ data, error }) => setSession(data.session ?? (error && isAuthRetryableFetchError(error) ? storedSession() : null)))
      .catch(() => setSession(storedSession()))
      .finally(() => {
        settled = true;
        clearTimeout(early);
        setAuthReady(true);
      });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      // The first answer is the one above (it knows about a failed renewal).
      if (event !== "INITIAL_SESSION") setSession(s);
    });
    return () => {
      clearTimeout(early);
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const who = useRef(userId);
  useEffect(() => {
    who.current = userId;
  }, [userId]);

  // The copy kept on the phone at once (so the app opens without internet),
  // then fresh from the server.
  const load = useCallback(async () => {
    if (!userId) return setData({ for: "", profile: null, memberships: [] });
    const saved = readCache<Account>(`account.${userId}`);
    if (saved) setData({ for: userId, ...saved });
    try {
      const a = await fetchAccount(userId);
      writeCache(`account.${userId}`, a);
      if (who.current === userId) setData({ for: userId, ...a });
      // True once when this sign-in cancelled an account deletion request.
      const notice = await supabase.rpc("take_deletion_notice");
      if (notice.data === true && who.current === userId) setRestored(true);
    } catch {
      if (!saved && who.current === userId) setData({ for: userId, profile: null, memberships: [] });
    }
  }, [userId]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, load]);

  // Back online: the farms may have changed meanwhile.
  useEffect(() => (userId ? onReconnect(() => void load()) : undefined), [userId, load]);

  const loaded = data !== null && data.for === (userId ?? "");
  const profile = loaded ? data.profile : null;
  const memberships = useMemo(() => (loaded ? data.memberships : []), [loaded, data]);

  const current = memberships.find((m) => m.farm.id === farmId) ?? memberships[0] ?? null;

  const value = useMemo<SessionState>(
    () => ({
      ready: authReady && loaded,
      introSeen,
      finishIntro: () => {
        setItem(KEYS.introSeen, "1");
        setIntroSeen(true);
      },
      session,
      profile,
      memberships,
      current,
      setCurrentFarm: (id) => {
        setItem(KEYS.farm, id);
        setFarmId(id);
      },
      restored,
      clearRestored: () => setRestored(false),
      planPending,
      setPlanPending: (v) => {
        setItem(KEYS.planPending, v ? "1" : null);
        setPlanPendingState(v);
      },
      reload: load,
      signOut: async () => {
        await supabase.auth.signOut();
        clearCache();
        setItem(KEYS.farm, null);
        setItem(KEYS.planPending, null);
        setFarmId(null);
        setPlanPendingState(false);
      },
    }),
    [authReady, loaded, introSeen, session, profile, memberships, current, planPending, restored, load],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The sign-in Supabase keeps on the phone, even when it has expired (it is renewed once online). */
function storedSession(): Session | null {
  try {
    const key = (supabase.auth as unknown as { storageKey: string }).storageKey;
    const s = JSON.parse(getItem(key) ?? "null") as Session | null;
    return s && s.user?.id && s.refresh_token && s.access_token ? s : null;
  } catch {
    return null;
  }
}

/** The person's profile and farms (a copy is kept on the phone, see `load`). */
async function fetchAccount(userId: string): Promise<Account> {
  const [p, m] = await Promise.all([
    supabase.from("profiles").select("full_name, account_type, avatar_url, phone").eq("id", userId).maybeSingle(),
    supabase.from("farm_members").select(`role, created_at, farm:farms!inner(${FARM_COLUMNS})`).eq("user_id", userId).order("created_at"),
  ]);
  if (m.error) throw new Error(m.error.message);
  const rows = ((m.data ?? []) as unknown as { role: Membership["role"]; farm: Farm }[]).filter((r) => r.farm && !r.farm.suspended);
  return { profile: (p.data as Profile | null) ?? null, memberships: rows.map((r) => ({ role: r.role, farm: r.farm })) };
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}
