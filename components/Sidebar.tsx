"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarDays, Home, Radio, Wrench, ListChecks, LogOut } from "lucide-react";
import { useMember } from "./MemberProvider";
import { Avatar, Brand } from "./Ui";

const ITEMS = [
  { href: "/", label: "Home", short: "Home", icon: Home },
  { href: "/schedule", label: "Schedule", short: "Schedule", icon: Calendar },
  { href: "/calendar", label: "Calendar", short: "Calendar", icon: CalendarDays },
  { href: "/stream-setup", label: "Stream Setup", short: "Setup", icon: Radio },
  { href: "/troubleshooting", label: "Troubleshooting", short: "Issues", icon: Wrench },
  { href: "/checklist", label: "Sunday Checklist", short: "Checklist", icon: ListChecks },
];

function AdminBadge() {
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-tally border border-tally/50 shrink-0">
      Admin
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { me, isAdmin, signOut } = useMember();

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-panel/90 backdrop-blur border-b border-border shrink-0"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <Brand />
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && <AdminBadge />}
          <button onClick={signOut} title="Sign out" aria-label="Sign out" className="text-muted-2 hover:text-text p-1">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-panel/90 backdrop-blur border-t border-border flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2.5"
              style={{ color: active ? "var(--tally)" : "var(--muted)" }}
            >
              {active && <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-tally" />}
              <Icon size={19} />
              <span className="text-[10px] truncate max-w-full px-0.5">{item.short}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:w-60 md:flex-col md:sticky md:top-0 md:h-screen bg-panel border-r border-border shrink-0">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <div className="flex flex-col flex-1 gap-1 px-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors hover:bg-panel-2"
                style={{
                  color: active ? "var(--text)" : "var(--muted)",
                  background: active ? "var(--panel-2)" : undefined,
                }}
              >
                <Icon size={16} style={{ color: active ? "var(--tally)" : undefined }} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-4 border-t border-border mt-auto">
          <span className="text-sm text-muted flex items-center gap-2 min-w-0">
            {me && <Avatar name={me} />}
            <span className="truncate">{me}</span>
            {isAdmin && <AdminBadge />}
          </span>
          <button onClick={signOut} title="Sign out" aria-label="Sign out" className="text-muted-2 hover:text-text shrink-0">
            <LogOut size={15} />
          </button>
        </div>
      </nav>
    </>
  );
}
