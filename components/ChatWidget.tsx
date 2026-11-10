"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history: messages }),
      });
      const data = await res.json();
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong." },
      ]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Couldn't reach the chatbot — try again." }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6 w-12 h-12 rounded-full bg-tally text-[#160705] flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-40"
        title="Ask the help assistant"
        aria-label="Ask the help assistant"
      >
        <MessageCircle size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6 w-[min(360px,calc(100vw-2rem))] h-[min(480px,calc(100vh-11rem))] md:h-[min(480px,calc(100vh-6rem))] card shadow-xl flex flex-col overflow-hidden z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm" style={{ fontFamily: "var(--font-head)" }}>
          Help assistant
        </span>
        <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-2 hover:text-text">
          <X size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-2 leading-relaxed">
            Ask about stream setup, troubleshooting or the checklist.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className="text-sm px-3 py-2 rounded-xl max-w-[85%] w-fit"
            style={{
              marginLeft: m.role === "user" ? "auto" : 0,
              background: m.role === "user" ? "var(--tally)" : "var(--panel-2)",
              color: m.role === "user" ? "#160705" : "var(--text)",
              border: m.role === "user" ? "none" : "1px solid var(--border)",
            }}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="text-xs text-muted-2">Thinking…</div>}
      </div>

      <div className="flex gap-2 p-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question…"
          className="field flex-1 min-w-0"
        />
        <button onClick={send} disabled={busy} aria-label="Send" className="btn btn-primary">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
