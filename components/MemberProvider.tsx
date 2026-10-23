"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { MemberRole } from "@/lib/types";

type MemberContextValue = {
  me: string | null;
  isAdmin: boolean;
  roster: string[];
  signOut: () => Promise<void>;
  loading: boolean;
};

const MemberContext = createContext<MemberContextValue | null>(null);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [role, setRole] = useState<MemberRole>("member");
  const [roster, setRoster] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoster = useCallback(async () => {
    const { data } = await supabase.from("members").select("name").order("created_at");
    setRoster((data ?? []).map((m) => m.name));
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    // Retry on network errors (common right after opening from the home screen)
    // so a flaky first request doesn't bounce a signed-in person to the sign-in page.
    const cacheKey = `hub-profile:${userId}`;
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, error } = await supabase
        .from("members")
        .select("name, role")
        .eq("user_id", userId)
        .maybeSingle();
      if (!error) {
        setMe(data?.name ?? null);
        setRole((data?.role as MemberRole) ?? "member");
        try {
          if (data) localStorage.setItem(cacheKey, JSON.stringify(data));
          else localStorage.removeItem(cacheKey);
        } catch {}
        return;
      }
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
    // Still offline: fall back to the last profile seen on this device so a
    // signed-in person isn't shown the sign-in page just because of bad signal.
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "null");
      if (cached?.name) {
        setMe(cached.name);
        setRole((cached.role as MemberRole) ?? "member");
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Ask the browser not to evict saved data (including the login) under storage pressure.
    navigator.storage?.persist?.().catch(() => {});

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // Token refreshes don't change who's signed in; no need to refetch the profile.
      if (event === "TOKEN_REFRESHED") return;
      if (newSession) {
        loadProfile(newSession.user.id);
      } else {
        setMe(null);
        setRole("member");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    loadRoster();

    const channel = supabase
      .channel("members-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => {
        loadRoster();
        loadProfile(userId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadRoster, loadProfile]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <MemberContext.Provider value={{ me, isAdmin: role === "admin", roster, signOut, loading }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used inside MemberProvider");
  return ctx;
}
