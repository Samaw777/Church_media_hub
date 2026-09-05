"use client";

import { useMember } from "./MemberProvider";
import { NameGate } from "./NameGate";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMember();

  if (loading) {
    return <div className="min-h-screen w-full bg-bg" />;
  }

  if (!me) {
    return <NameGate />;
  }

  return (
    <div className="w-full min-h-screen bg-bg text-text flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 max-w-5xl">{children}</main>
    </div>
  );
}
