"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleDot } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const readyRef = useRef(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function markReady() {
      readyRef.current = true;
      setReady(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) markReady();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) markReady();
    });

    const timeout = setTimeout(() => {
      if (!cancelled && !readyRef.current) setInvalid(true);
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (busy) return;
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <CircleDot size={18} className="text-tally" />
          <span className="uppercase tracking-wide text-xs text-muted" style={{ fontFamily: "var(--font-mono)" }}>
            Media Team Hub
          </span>
        </div>

        {done ? (
          <>
            <h1 className="text-2xl mb-2 text-center" style={{ fontFamily: "var(--font-head)" }}>
              Password updated
            </h1>
            <p className="text-sm text-muted mb-5 leading-relaxed text-center">
              You're all set. Continue to the app with your new password.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-tally text-[#160705] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              Continue <ArrowRight size={16} />
            </button>
          </>
        ) : ready ? (
          <>
            <h1 className="text-2xl mb-2 text-center" style={{ fontFamily: "var(--font-head)" }}>
              Set a new password
            </h1>
            <p className="text-sm text-muted mb-5 leading-relaxed text-center">
              Choose a new password for your account.
            </p>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full bg-panel border border-border px-4 py-3 text-text placeholder-muted-2 outline-none focus:border-tally mb-3"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Confirm new password"
              className="w-full bg-panel border border-border px-4 py-3 text-text placeholder-muted-2 outline-none focus:border-tally mb-3"
            />
            {error && <p className="text-sm text-tally mb-3">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="w-full py-3 bg-tally text-[#160705] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {busy ? "Please wait…" : "Update password"} <ArrowRight size={16} />
            </button>
          </>
        ) : invalid ? (
          <>
            <h1 className="text-2xl mb-2 text-center" style={{ fontFamily: "var(--font-head)" }}>
              Link expired
            </h1>
            <p className="text-sm text-muted mb-5 leading-relaxed text-center">
              This reset link is invalid or has expired. Go back and request a new one from the
              sign-in page.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-panel-2 border border-border text-sm hover:border-muted"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <p className="text-sm text-muted text-center">Verifying your link…</p>
        )}
      </div>
    </div>
  );
}
