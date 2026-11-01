"use client";

import { useId, type ReactNode } from "react";

// Wide media team scenes for page banners. Scenes are cropped from the sides on phones,
// so the important part of each drawing stays between x=190 and x=610.

const FRAME = "#0b0e10";
const STAGE = "#16283a";
const BAR_COLORS = ["#d9d9d2", "#d8c23d", "#3fb6c9", "#3fb88a", "#b65cc4", "#e4483c", "#3a62c9"];

function Scene({ height = 160, children }: { height?: number; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <svg
      viewBox={`0 0 800 ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className="pointer-events-none block w-full h-full"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1114" />
          <stop offset="100%" stopColor="#1a1416" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="var(--tally)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--tally)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height={height} fill={`url(#${id}-sky)`} />
      <rect width="800" height={height} fill={`url(#${id}-glow)`} />
      {children(id)}
    </svg>
  );
}

function Meters({ x, y, count = 8, height = 70, gap = 12 }: { x: number; y: number; count?: number; height?: number; gap?: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={x + i * gap}
          y={y}
          width={gap - 4}
          height={height}
          rx="1.5"
          fill={i % 3 === 2 ? "var(--warn)" : "var(--ok)"}
          className="eq-bar"
          style={{ animationDelay: `${-0.27 * ((i * 7) % 11)}s` }}
        />
      ))}
    </g>
  );
}

function Faders({ x, y, count, gap = 14, height = 34 }: { x: number; y: number; count: number; gap?: number; height?: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const knob = y + (((i * 5) % 7) / 7) * (height - 8);
        return (
          <g key={i}>
            <rect x={x + i * gap} y={y} width="2" height={height} fill="#000" />
            <rect x={x + i * gap - 4} y={knob} width="10" height="8" rx="1.5" fill={i === 2 ? "var(--tally)" : "var(--muted)"} />
          </g>
        );
      })}
    </g>
  );
}

function CrewMember({ x, y = 58, color }: { x: number; y?: number; color: string }) {
  return (
    <g fill={color}>
      <circle cx={x} cy={y} r="13" />
      <path d={`M${x - 24} 140 q0 -58 24 -58 q24 0 24 58 z`} />
      <path d={`M${x - 15} ${y} a15 15 0 0 1 30 0`} fill="none" stroke="var(--tally)" strokeWidth="3" />
      <rect x={x + 12} y={y - 3} width="6" height="11" rx="2" fill="var(--tally)" />
      <path d={`M${x + 16} ${y + 8} q-2 9 -13 9`} fill="none" stroke="var(--tally)" strokeWidth="2" />
    </g>
  );
}

export function CrewArt() {
  return (
    <Scene>
      {() => (
        <>
          <path d="M84 40 H716" stroke="var(--tally)" strokeWidth="2" className="comm-line" />
          <rect x="0" y="140" width="800" height="20" fill="#20262a" />

          <CrewMember x={230} color="#37454f" />
          <g>
            <rect x="262" y="64" width="62" height="32" rx="5" fill="#465660" />
            <path d="M324 72 l18 -7 v30 l-18 -7 z" fill="#37454f" />
            <circle cx="272" cy="60" r="4" fill="var(--tally)" className="tally-dot" />
            <path d="M292 96 L272 140 M292 96 L312 140 M292 96 V140" stroke="#7a8187" strokeWidth="3" fill="none" />
          </g>

          <CrewMember x={400} color="#3d4a63" />
          <g>
            <rect x="362" y="104" width="76" height="36" rx="3" fill="#2a3036" stroke="#465660" />
            <rect x="370" y="110" width="28" height="20" rx="2" fill={STAGE} />
            <rect x="404" y="110" width="28" height="20" rx="2" fill="var(--tally)" opacity="0.75" />
          </g>

          <CrewMember x={560} color="#37454f" />
          <g>
            <rect x="516" y="108" width="92" height="32" rx="3" fill="#2a3036" stroke="#465660" />
            <Faders x={530} y={113} count={6} height={22} gap={13} />
          </g>

          <Meters x={46} y={70} count={8} height={70} gap={13} />
          <Meters x={650} y={70} count={8} height={70} gap={13} />
        </>
      )}
    </Scene>
  );
}

export function ClapperArt() {
  return (
    <Scene>
      {() => (
        <>
          <g className="film-roll">
            {Array.from({ length: 13 }, (_, i) => (
              <g key={i} transform={`translate(${i * 72 - 72} 0)`}>
                <rect x="0" y="34" width="72" height="92" fill="#090b0d" />
                <rect x="6" y="50" width="60" height="60" rx="3" fill={i % 3 === 0 ? STAGE : i % 3 === 1 ? "#1c2233" : "#2a1b33"} />
                {[0, 1, 2].map((n) => (
                  <g key={n} fill="#2c3236">
                    <rect x={8 + n * 22} y="39" width="12" height="7" rx="1.5" />
                    <rect x={8 + n * 22} y="114" width="12" height="7" rx="1.5" />
                  </g>
                ))}
              </g>
            ))}
          </g>
          <g transform="translate(320 26)">
            <rect x="0" y="34" width="160" height="96" rx="6" fill="#20262a" stroke="var(--muted-2)" strokeWidth="2" />
            <text x="14" y="64" fontSize="13" fontWeight="600" fill="var(--text)" fontFamily="var(--font-body)">
              SUNDAY SERVICE
            </text>
            <path d="M14 74 H146 M14 100 H146 M80 74 V100" stroke="var(--muted-2)" />
            <text x="14" y="92" fontSize="10" fill="var(--muted)" fontFamily="var(--font-body)">SCENE 1</text>
            <text x="90" y="92" fontSize="10" fill="var(--muted)" fontFamily="var(--font-body)">TAKE 1</text>
            <circle cx="20" cy="116" r="4" fill="var(--tally)" className="tally-dot" />
            <text x="30" y="120" fontSize="10" fill="var(--muted)" fontFamily="var(--font-body)">ROLLING</text>
            <g transform="rotate(-11 0 34)">
              <rect x="0" y="12" width="160" height="22" rx="3" fill="#20262a" stroke="var(--muted-2)" strokeWidth="2" />
              {[0, 1, 2, 3].map((n) => (
                <path key={n} d={`M${10 + n * 38} 13 h18 l-12 20 h-18 z`} fill="var(--text)" />
              ))}
            </g>
          </g>
        </>
      )}
    </Scene>
  );
}

function Tick({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="10" fill="var(--ok)" />
      <path d={`M${x - 4.5} ${y} l3.2 3.5 l6 -7`} fill="none" stroke="#06140e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function GearArt() {
  return (
    <Scene>
      {() => (
        <>
          <rect x="0" y="130" width="800" height="30" fill="#20262a" />
          <rect x="0" y="128" width="800" height="3" fill="#39424a" />

          <g>
            <rect x="58" y="74" width="74" height="42" rx="6" fill="#465660" />
            <circle cx="95" cy="95" r="15" fill="#101315" stroke="#7a8187" strokeWidth="3" />
            <path d="M95 116 V130" stroke="#7a8187" strokeWidth="4" />
          </g>

          <g>
            <rect x="204" y="52" width="24" height="46" rx="12" fill="#7a8187" />
            {[62, 70, 78].map((y) => (
              <path key={y} d={`M206 ${y} H226`} stroke="#39424a" strokeWidth="2" />
            ))}
            <path d="M196 80 a20 20 0 0 0 40 0 M216 100 V130 M200 130 H232" fill="none" stroke="#a4aaaf" strokeWidth="4" strokeLinecap="round" />
            <Tick x={244} y={52} />
          </g>

          <g>
            <path d="M302 96 a38 38 0 0 1 76 0" fill="none" stroke="#7a8187" strokeWidth="6" />
            <rect x="290" y="88" width="20" height="36" rx="8" fill="#465660" />
            <rect x="370" y="88" width="20" height="36" rx="8" fill="#465660" />
            <path d="M300 124 q6 18 30 6" fill="none" stroke="var(--tally)" strokeWidth="3" />
            <Tick x={392} y={70} />
          </g>

          <g>
            <rect x="430" y="82" width="120" height="48" rx="4" fill="#2a3036" stroke="#465660" />
            <Faders x={444} y={90} count={7} gap={15} height={32} />
            <Tick x={556} y={78} />
          </g>

          <g fill="none" stroke="#a4aaaf" strokeWidth="4">
            <ellipse cx="660" cy="112" rx="42" ry="16" />
            <ellipse cx="660" cy="108" rx="42" ry="16" stroke="#7a8187" />
            <ellipse cx="660" cy="104" rx="42" ry="16" />
          </g>
        </>
      )}
    </Scene>
  );
}

export function OnAirArt() {
  return (
    <Scene>
      {(id) => (
        <>
          <defs>
            <radialGradient id={`${id}-sign`}>
              <stop offset="0%" stopColor="var(--tally)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--tally)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <Meters x={18} y={40} count={12} height={100} gap={13} />
          <Meters x={626} y={40} count={12} height={100} gap={13} />

          <g fill="none" stroke="var(--tally)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M268 66 a34 34 0 0 0 0 40" opacity="0.8" />
            <path d="M252 54 a56 56 0 0 0 0 64" opacity="0.4" />
            <path d="M532 66 a34 34 0 0 1 0 40" opacity="0.8" />
            <path d="M548 54 a56 56 0 0 1 0 64" opacity="0.4" />
          </g>

          <ellipse cx="400" cy="86" rx="230" ry="90" fill={`url(#${id}-sign)`} className="tally-dot" />
          <rect x="288" y="46" width="224" height="80" rx="12" fill="#2a0d0a" stroke="var(--tally)" strokeWidth="3" />
          <text
            x="400"
            y="102"
            textAnchor="middle"
            fontSize="46"
            fontWeight="600"
            letterSpacing="4"
            fill="#ff6a5c"
            fontFamily="var(--font-body)"
          >
            ON AIR
          </text>
        </>
      )}
    </Scene>
  );
}

export function TestCardArt() {
  return (
    <Scene>
      {() => (
        <>
          {BAR_COLORS.map((c, i) => (
            <rect key={c} x={(i * 800) / 7} width={800 / 7 + 1} height="160" fill={c} opacity="0.22" />
          ))}
          <g>
            <rect x="282" y="20" width="236" height="120" rx="8" fill={FRAME} stroke="var(--muted-2)" strokeWidth="2" />
            {BAR_COLORS.map((c, i) => (
              <rect key={c} x={290 + i * 31.4} y="28" width="32" height="72" fill={c} />
            ))}
            <rect x="290" y="100" width="220" height="32" fill="#101315" />
            <text x="400" y="122" textAnchor="middle" fontSize="16" fontWeight="600" letterSpacing="3" fill="var(--text)" fontFamily="var(--font-body)">
              STAND BY
            </text>
          </g>
          <g fill="none" strokeLinecap="round">
            <path d="M0 110 C70 110 90 60 150 80 S210 96 232 96" stroke="#a4aaaf" strokeWidth="5" />
            <path d="M800 70 C730 70 720 112 660 96 S592 80 568 80" stroke="#a4aaaf" strokeWidth="5" />
          </g>
          <rect x="228" y="86" width="26" height="20" rx="3" fill="#465660" />
          <rect x="546" y="70" width="26" height="20" rx="3" fill="#465660" />
          <path d="M254 91 H266 M254 101 H266 M546 75 H534 M546 85 H534" stroke="#d9d9d2" strokeWidth="3" />
        </>
      )}
    </Scene>
  );
}
