"use client";

import { useState } from "react";
import { ArrowRight, CircleDot } from "lucide-react";
import { useMember } from "./MemberProvider";

export function NameGate() {
  const { join } = useMember();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleJoin() {
    if (!name.trim() || busy) return;
    setBusy(true);
    await join(name);
    setBusy(false);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <CircleDot size={18} className="text-tally" />
          <span
            className="uppercase tracking-wide text-xs text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Media Team Hub
          </span>
        </div>
        <h1 className="text-2xl mb-2 text-center" style={{ fontFamily: "var(--font-head)" }}>
          What&apos;s your name?
        </h1>
        <p className="text-sm text-muted mb-5 leading-relaxed text-center">
          Used to track availability, check-ins, and who logged what. No password — just for the
          team.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          placeholder="e.g. Jordan"
          className="w-full bg-panel border border-border px-4 py-3 text-text placeholder-muted-2 outline-none focus:border-tally mb-3"
        />
        <button
          onClick={handleJoin}
          disabled={busy}
          className="w-full py-3 bg-tally text-[#160705] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {busy ? "Joining…" : "Continue"} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
