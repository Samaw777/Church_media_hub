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
        className="fixed bottom-20 right-5 md:bottom-5 w-12 h-12 rounded-full bg-tally text-[#160705] flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-40"
        title="Ask the help assistant"
      >
        <MessageCircle size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-5 md:bottom-5 w-[min(360px,calc(100vw-2.5rem))] h-[min(480px,calc(100vh-9rem))] md:h-[min(480px,calc(100vh-6rem))] bg-panel border border-border shadow-xl flex flex-col z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm" style={{ fontFamily: "var(--font-head)" }}>
          Help assistant
        </span>
        <button onClick={() => setOpen(false)} className="text-muted-2 hover:text-text">
          <X size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-2 leading-relaxed">
            Ask about stream setup, troubleshooting, or the checklist — e.g. &quot;how do I connect
            Wirecast to YouTube?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className="text-sm px-3 py-2 max-w-[85%]"
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
          className="flex-1 bg-bg border border-border px-3 py-2 text-sm outline-none focus:border-tally"
        />
        <button onClick={send} disabled={busy} className="px-3 py-2 bg-tally text-[#160705] disabled:opacity-60">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
