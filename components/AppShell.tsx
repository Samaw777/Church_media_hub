"use client";

import { usePathname } from "next/navigation";
import { useMember } from "./MemberProvider";
import { AuthGate } from "./AuthGate";
import { Sidebar } from "./Sidebar";
import { ChatWidget } from "./ChatWidget";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMember();
  const pathname = usePathname();

  // This route handles its own auth state (a recovery-link session lands here
  // before a normal login exists), so it manages its own full-screen UI.
  if (pathname === "/reset-password") {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="min-h-screen w-full bg-bg" />;
  }

  if (!me) {
    return <AuthGate />;
  }

  return (
    <div className="w-full min-h-screen bg-bg text-text flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 pb-24 md:p-8 max-w-5xl">{children}</main>
      <ChatWidget />
    </div>
  );
}
