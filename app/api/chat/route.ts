import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buildKnowledgeBase } from "@/lib/knowledge";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Sign in to use the chatbot." }, { status: 401 });
  }
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Sign in to use the chatbot." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The chatbot isn't set up yet — ask an admin to add a GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const message: string = body?.message ?? "";
  const history: ChatMessage[] = Array.isArray(body?.history) ? body.history.slice(-10) : [];

  if (!message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const systemInstruction = {
    parts: [
      {
        text:
          "You are the help assistant inside Media Team Hub, a church media/livestream team's " +
          "internal app. Answer questions using ONLY the reference material below, plus general " +
          "Wirecast/YouTube livestreaming knowledge if it's clearly consistent with that material. " +
          "Be concise and practical — this is for volunteers who need a quick answer, not an essay. " +
          "If something isn't covered and you're not confident, say so and suggest logging it on " +
          "the Troubleshooting page instead of guessing.\n\n" +
          buildKnowledgeBase(),
      },
    ],
  };

  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction, contents }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Gemini API error:", res.status, errText);
    return NextResponse.json({ error: "The chatbot is having trouble right now — try again shortly." }, { status: 502 });
  }

  const data = await res.json();
  const reply: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ||
    "I couldn't come up with an answer to that — try rephrasing, or log it on the Troubleshooting page.";

  return NextResponse.json({ reply });
}
