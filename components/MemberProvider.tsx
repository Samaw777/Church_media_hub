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
    const { data } = await supabase
      .from("members")
      .select("name, role")
      .eq("user_id", userId)
      .maybeSingle();
    setMe(data?.name ?? null);
    setRole((data?.role as MemberRole) ?? "member");
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
