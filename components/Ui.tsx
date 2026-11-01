"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { IconTile, SignalRings } from "./Graphics";

const AVATAR_COLORS = ["#6f9df2", "#3fb88a", "#e3a83d", "#b98ae0", "#4fb6c9", "#e58a6d"];

function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Brand({ size = "md" }: { size?: "md" | "lg" }) {
  const ring = size === "lg" ? "w-7 h-7" : "w-5 h-5";
  const dot = size === "lg" ? "w-2.5 h-2.5" : "w-2 h-2";
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <span className={`${ring} rounded-full border-2 border-tally flex items-center justify-center shrink-0`}>
        <span className={`${dot} rounded-full bg-tally tally-dot`} />
      </span>
      <span className={`${size === "lg" ? "text-lg" : "text-sm"} truncate`} style={{ fontFamily: "var(--font-head)" }}>
        Media Team Hub
      </span>
    </span>
  );
}

export function Avatar({ name, highlight }: { name: string; highlight?: boolean }) {
  const color = avatarColor(name);
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
      style={{
        background: highlight ? "var(--tally)" : `color-mix(in srgb, ${color} 20%, transparent)`,
        color: highlight ? "#160705" : color,
      }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  right,
  icon,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="card relative overflow-hidden mb-6 p-5 md:p-6">
      <SignalRings className="absolute top-0 right-0 h-56 w-56" />
      <div className="relative flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 min-w-0">
          {icon && <IconTile icon={icon} />}
          <div className="min-w-0">
            <p className="eyebrow mb-1">{eyebrow}</p>
            <h1 className="text-3xl" style={{ fontFamily: "var(--font-head)" }}>
              {title}
            </h1>
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tally,
  href,
  loading,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  tally: string;
  href: string;
  loading?: boolean;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="card block p-3 sm:p-4 min-w-0 hover:border-muted-2 transition-colors">
      <p className="eyebrow flex items-center gap-1 sm:gap-1.5 mb-2">
        <Icon size={12} className="shrink-0" style={{ color: tally }} />
        <span className="whitespace-nowrap">{label}</span>
      </p>
      <p className="text-2xl mb-1" style={{ fontFamily: "var(--font-head)" }}>
        {loading ? "—" : value}
      </p>
      <p className="text-xs text-muted">{sub}</p>
    </Link>
  );
}
