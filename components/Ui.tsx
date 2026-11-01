"use client";

import Link from "next/link";

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
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
      style={{
        background: highlight ? "var(--tally)" : "var(--panel-2)",
        color: highlight ? "#160705" : "var(--muted)",
        border: highlight ? "none" : "1px solid var(--border)",
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
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        <p className="eyebrow mb-1">{eyebrow}</p>
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-head)" }}>
          {title}
        </h1>
      </div>
      {right}
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
}: {
  label: string;
  value: string;
  sub: string;
  tally: string;
  href: string;
  loading?: boolean;
}) {
  return (
    <Link href={href} className="card block p-3 sm:p-4 min-w-0 hover:border-muted-2 transition-colors">
      <p className="eyebrow flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tally }} />
        <span className="whitespace-nowrap">{label}</span>
      </p>
      <p className="text-2xl mb-1" style={{ fontFamily: "var(--font-head)" }}>
        {loading ? "—" : value}
      </p>
      <p className="text-xs text-muted">{sub}</p>
    </Link>
  );
}
