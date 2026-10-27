// Who is signed in, their farms and the farm they are working on. Everything
// is read with the person's own session, so the database's row-level security
// decides what they see (exactly as on the website).
import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Farm, Membership } from "./farm";
import { getItem, KEYS, setItem } from "./storage";
import { supabase } from "./supabase";

type Profile = { full_name: string | null; account_type: "farmer" | "doctor"; avatar_url: string | null; phone: string | null };

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

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setAuthReady(true));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const load = useCallback(async () => {
    const d = userId ? await fetchAccount(userId).catch(() => ({ profile: null, memberships: [] })) : { profile: null, memberships: [] };
    setData({ for: userId ?? "", ...d });
  }, [userId]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      const d = userId ? await fetchAccount(userId).catch(() => ({ profile: null, memberships: [] })) : { profile: null, memberships: [] };
      if (!cancelled) setData({ for: userId ?? "", ...d });
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, userId]);

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
      planPending,
      setPlanPending: (v) => {
        setItem(KEYS.planPending, v ? "1" : null);
        setPlanPendingState(v);
      },
      reload: load,
      signOut: async () => {
        await supabase.auth.signOut();
        setItem(KEYS.farm, null);
        setItem(KEYS.planPending, null);
        setFarmId(null);
        setPlanPendingState(false);
      },
    }),
    [authReady, loaded, introSeen, session, profile, memberships, current, planPending, load],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

async function fetchAccount(userId: string): Promise<{ profile: Profile | null; memberships: Membership[] }> {
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
