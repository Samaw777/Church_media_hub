"use client";

import { useState } from "react";
import { ArrowRight, CircleDot } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Mode = "sign-in" | "sign-up" | "reset";

export function AuthGate() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleReset() {
    if (busy) return;
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setNotice("Check your email for a link to reset your password.");
    }
    setBusy(false);
  }

  async function handleSubmit() {
    if (busy) return;
    setError("");
    setNotice("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (mode === "sign-up" && !name.trim()) {
      setError("Enter the name your team will see you as.");
      return;
    }

    setBusy(true);
    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) {
        setError(error.message);
      } else if (!data.session) {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("sign-in");
      }
    }
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
          {mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create your account" : "Reset password"}
        </h1>
        <p className="text-sm text-muted mb-5 leading-relaxed text-center">
          {mode === "sign-in"
            ? "Sign in with the email and password you set up for the team."
            : mode === "sign-up"
              ? "One account per person. Your name is what the rest of the team will see."
              : "Enter your email and we'll send you a link to set a new password."}
        </p>

        {mode === "sign-up" && (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name, e.g. Jordan"
            className="w-full bg-panel border border-border px-4 py-3 text-text placeholder-muted-2 outline-none focus:border-tally mb-3"
          />
        )}
        <input
          type="email"
          autoFocus={mode !== "sign-up"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && mode === "reset" && handleReset()}
          placeholder="you@example.com"
          className="w-full bg-panel border border-border px-4 py-3 text-text placeholder-muted-2 outline-none focus:border-tally mb-3"
        />
        {mode !== "reset" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Password"
            className="w-full bg-panel border border-border px-4 py-3 text-text placeholder-muted-2 outline-none focus:border-tally mb-3"
          />
        )}

        {mode === "sign-in" && (
          <button
            onClick={() => switchMode("reset")}
            className="w-full text-right text-xs text-muted-2 hover:text-muted -mt-1 mb-3"
          >
            Forgot password?
          </button>
        )}

        {error && <p className="text-sm text-tally mb-3">{error}</p>}
        {notice && <p className="text-sm text-ok mb-3">{notice}</p>}

        <button
          onClick={mode === "reset" ? handleReset : handleSubmit}
          disabled={busy}
          className="w-full py-3 bg-tally text-[#160705] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : mode === "sign-in"
              ? "Sign in"
              : mode === "sign-up"
                ? "Create account"
                : "Send reset link"}{" "}
          <ArrowRight size={16} />
        </button>

        {mode === "reset" ? (
          <button onClick={() => switchMode("sign-in")} className="w-full text-center text-sm text-muted hover:text-text mt-4">
            Back to sign in
          </button>
        ) : (
          <button
            onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            className="w-full text-center text-sm text-muted hover:text-text mt-4"
          >
            {mode === "sign-in" ? "New to the team? Create an account" : "Already have an account? Sign in"}
          </button>
        )}
      </div>
    </div>
  );
}
