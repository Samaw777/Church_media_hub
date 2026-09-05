"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  Radio,
  Wrench,
  ListChecks,
  CircleDot,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useMember } from "./MemberProvider";

const ITEMS = [
  { href: "/", label: "Home", icon: CircleDot },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/stream-setup", label: "Stream Setup", icon: Radio },
  { href: "/troubleshooting", label: "Troubleshooting", icon: Wrench },
  { href: "/checklist", label: "Sunday Checklist", icon: ListChecks },
];

export function Sidebar() {
  const pathname = usePathname();
  const { me, isAdmin, signOut } = useMember();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden bg-panel border-b border-border shrink-0">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <CircleDot size={16} className="text-tally tally-dot" />
            <span className="text-xs uppercase tracking-wide text-muted" style={{ fontFamily: "var(--font-mono)" }}>
              Media Team Hub
            </span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-10 h-10 bg-tally text-[#160705] active:opacity-80 transition-opacity"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border">
            {ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm border-l-2 transition-colors"
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
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border">
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
              <button onClick={signOut} className="text-muted-2 hover:text-text flex items-center gap-1.5 text-sm shrink-0">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

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
