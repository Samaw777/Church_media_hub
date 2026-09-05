"use client";

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
        <p className="text-xs uppercase tracking-wide text-muted mb-1" style={{ fontFamily: "var(--font-mono)" }}>
          {eyebrow}
        </p>
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
    <div className="bg-panel border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-wide text-muted" style={{ fontFamily: "var(--font-mono)" }}>
          {title}
        </h2>
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
    <a
      href={href}
      className="text-left bg-panel border border-border p-4 hover:border-muted transition-colors block"
      style={{ borderLeft: `3px solid ${tally}` }}
    >
      <p className="text-xs uppercase tracking-wide text-muted-2 mb-2" style={{ fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      <p className="text-2xl mb-1" style={{ fontFamily: "var(--font-head)" }}>
        {loading ? "—" : value}
      </p>
      <p className="text-xs text-muted">{sub}</p>
    </a>
  );
}
