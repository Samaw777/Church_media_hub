"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "church-media-hub:member";

type MemberContextValue = {
  me: string | null;
  roster: string[];
  join: (name: string) => Promise<void>;
  switchUser: () => void;
  loading: boolean;
};

const MemberContext = createContext<MemberContextValue | null>(null);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [roster, setRoster] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoster = useCallback(async () => {
    const { data } = await supabase.from("members").select("name").order("created_at");
    setRoster((data ?? []).map((m) => m.name));
  }, []);

  useEffect(() => {
    loadRoster().finally(() => setLoading(false));

    const channel = supabase
      .channel("members-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => {
        loadRoster();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRoster]);

  async function join(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await supabase.from("members").upsert({ name: trimmed }, { onConflict: "name" });
    localStorage.setItem(STORAGE_KEY, trimmed);
    setMe(trimmed);
    loadRoster();
  }

  function switchUser() {
    localStorage.removeItem(STORAGE_KEY);
    setMe(null);
  }

  return (
    <MemberContext.Provider value={{ me, roster, join, switchUser, loading }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used inside MemberProvider");
  return ctx;
}
