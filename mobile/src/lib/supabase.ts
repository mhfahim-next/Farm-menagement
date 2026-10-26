import "./storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Same Supabase project as the website: row-level security decides what each person sees.
export const supabase = createClient(SUPABASE_URL || "http://localhost", SUPABASE_ANON_KEY || "missing", {
  auth: {
    storage: globalThis.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// Refresh the session only while the app is in front (Supabase's recommendation for mobile).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
