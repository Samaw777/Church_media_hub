"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarDays, Radio, Wrench, ListChecks, CircleDot, LogOut } from "lucide-react";
import { useMember } from "./MemberProvider";

const ITEMS = [
  { href: "/", label: "Home", short: "Home", icon: CircleDot },
  { href: "/schedule", label: "Schedule", short: "Schedule", icon: Calendar },
  { href: "/calendar", label: "Calendar", short: "Calendar", icon: CalendarDays },
  { href: "/stream-setup", label: "Stream Setup", short: "Setup", icon: Radio },
  { href: "/troubleshooting", label: "Troubleshooting", short: "Issues", icon: Wrench },
  { href: "/checklist", label: "Sunday Checklist", short: "Checklist", icon: ListChecks },
];

export function Sidebar() {
  const pathname = usePathname();
  const { me, isAdmin, signOut } = useMember();

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-panel border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <CircleDot size={16} className="text-tally tally-dot shrink-0" />
          <span className="text-xs uppercase tracking-wide text-muted" style={{ fontFamily: "var(--font-mono)" }}>
            Media Team Hub
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted truncate max-w-[72px]">{me}</span>
          {isAdmin && (
            <span
              className="text-[10px] px-1.5 py-0.5 uppercase text-tally border border-tally"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Admin
            </span>
          )}
          <button onClick={signOut} title="Sign out" className="text-muted-2 hover:text-text p-1">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-panel border-t border-border flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2.5"
              style={{ color: active ? "var(--tally)" : "var(--muted)" }}
            >
              <Icon size={19} />
              <span className="text-[10px] truncate max-w-full px-0.5">{item.short}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:w-56 md:flex-col bg-panel border-r border-border shrink-0 md:min-h-screen">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <CircleDot size={16} className="text-tally tally-dot" />
          <span className="text-xs uppercase tracking-wide text-muted" style={{ fontFamily: "var(--font-mono)" }}>
            Media Team Hub
          </span>
        </div>
        <div className="flex flex-col flex-1">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-5 py-3.5 text-sm whitespace-nowrap border-l-2 transition-colors"
                style={{
                  color: active ? "var(--text)" : "var(--muted)",
                  borderLeftColor: active ? "var(--tally)" : "transparent",
                  background: active ? "var(--panel-2)" : "transparent",
                }}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border mt-auto">
          <span className="text-sm text-muted truncate flex items-center gap-1.5">
            {me}
            {isAdmin && (
              <span
                className="text-[10px] px-1.5 py-0.5 uppercase text-tally border border-tally"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Admin
              </span>
            )}
          </span>
          <button onClick={signOut} title="Sign out" className="text-muted-2 hover:text-text">
            <LogOut size={14} />
          </button>
        </div>
      </nav>
    </>
  );
}
