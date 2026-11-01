"use client";

import { useId } from "react";
import type { LucideIcon } from "lucide-react";

// Decorative broadcast artwork, drawn in code so it stays sharp and adds no image downloads.

export function SignalRings({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 320 320" aria-hidden className={`pointer-events-none ${className}`}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx="320" cy="0" r="290">
          <stop offset="0%" stopColor="var(--tally)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--tally)" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {[50, 95, 140, 185, 230, 275].map((r) => (
        <circle key={r} cx="320" cy="0" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="1.5" />
      ))}
      <circle className="ring-pulse" cx="320" cy="0" r="50" fill="none" stroke="var(--tally)" strokeWidth="2" />
    </svg>
  );
}

export function StageLights({ className = "" }: { className?: string }) {
  const id = useId();
  const blur = `${id}-blur`;
  return (
    <svg
      viewBox="0 0 800 320"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden
      className={`pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={blur} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <g filter={`url(#${blur})`}>
        <polygon className="beam" points="160,-10 190,-10 330,320 60,320" fill={`url(#${id})`} />
        <polygon className="beam beam-alt" points="390,-10 420,-10 560,320 290,320" fill={`url(#${id})`} />
        <polygon className="beam" points="620,-10 650,-10 790,320 520,320" fill={`url(#${id})`} />
      </g>
    </svg>
  );
}

export function ProgressRing({ pct, size = 96, label }: { pct: number; size?: number; label?: string }) {
  const stroke = Math.max(6, size * 0.09);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const color = pct >= 100 ? "var(--ok)" : "var(--tally)";
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(pct, 100) / 100)}
          style={{ transition: "stroke-dashoffset 0.6s ease", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
        <span style={{ fontFamily: "var(--font-head)", fontSize: size * 0.24 }}>{pct}%</span>
        {label && <span className="text-[10px] text-muted">{label}</span>}
      </span>
    </span>
  );
}

export function IconTile({ icon: Icon, color = "var(--tally)" }: { icon: LucideIcon; color?: string }) {
  return (
    <span
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      <Icon size={20} />
    </span>
  );
}

export function CameraArt({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 240 190" aria-hidden className={className}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="var(--tally)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--tally)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill="none" stroke="var(--muted-2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M120 112 L84 182 M120 112 L156 182 M120 112 V176" />
        <path d="M100 150 H140" strokeWidth="2" />
      </g>
      <rect x="104" y="100" width="32" height="12" rx="3" fill="var(--panel-2)" stroke="var(--muted-2)" strokeWidth="2.5" />
      <rect x="70" y="50" width="96" height="50" rx="9" fill="var(--panel-2)" stroke="var(--muted)" strokeWidth="3" />
      <path d="M166 62 L196 52 V98 L166 88 Z" fill="var(--panel)" stroke="var(--muted)" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="199" cy="75" r="7" fill="var(--bg)" stroke="var(--muted-2)" strokeWidth="2.5" />
      <rect x="84" y="62" width="34" height="24" rx="4" fill="var(--bg)" stroke="var(--muted-2)" strokeWidth="2" />
      <path d="M92 69 L103 74 L92 79 Z" fill="var(--muted-2)" />
      <rect x="82" y="38" width="44" height="12" rx="4" fill="var(--panel-2)" stroke="var(--muted-2)" strokeWidth="2.5" />
      <circle cx="146" cy="38" r="26" fill={`url(#${id})`} className="tally-dot" />
      <circle cx="146" cy="38" r="7" fill="var(--tally)" />
      <g fill="none" stroke="var(--tally)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M160 26 a18 18 0 0 1 0 24" opacity="0.8" />
        <path d="M170 16 a32 32 0 0 1 0 44" opacity="0.45" />
      </g>
    </svg>
  );
}
