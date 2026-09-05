"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Radio, Wrench, ListChecks, CircleDot, LogOut } from "lucide-react";
import { useMember } from "./MemberProvider";

const ITEMS = [
  { href: "/", label: "Home", icon: CircleDot },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/stream-setup", label: "Stream Setup", icon: Radio },
  { href: "/troubleshooting", label: "Troubleshooting", icon: Wrench },
  { href: "/checklist", label: "Sunday Checklist", icon: ListChecks },
];

export function Sidebar() {
  const pathname = usePathname();
  const { me, switchUser } = useMember();

  return (
    <nav className="md:w-56 w-full bg-panel border-b md:border-b-0 md:border-r border-border flex md:flex-col shrink-0 md:min-h-screen">
      <div className="hidden md:flex items-center gap-2 px-5 py-5 border-b border-border">
        <CircleDot size={16} className="text-tally tally-dot" />
        <span className="text-xs uppercase tracking-wide text-muted" style={{ fontFamily: "var(--font-mono)" }}>
          Media Team Hub
        </span>
      </div>
      <div className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible">
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
      <div className="hidden md:flex items-center justify-between gap-2 px-5 py-4 border-t border-border mt-auto">
        <span className="text-sm text-muted truncate">{me}</span>
        <button onClick={switchUser} title="Not you?" className="text-muted-2 hover:text-text">
          <LogOut size={14} />
        </button>
      </div>
    </nav>
  );
}
