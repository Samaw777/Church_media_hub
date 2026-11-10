import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildReminderText, type ReminderKind } from "@/lib/reminder";

// Posts the weekly schedule reminder to the team Telegram group.
//
// Called every hour on Fridays and Sundays by .github/workflows/telegram-reminder.yml.
// It only posts at the right local time (Fri 6pm, Sun 7am Central, daylight saving
// included) and at most once per day, so the timer can be loose.
//
// Query options (all need the CRON_SECRET):
//   ?preview=1            return the message without posting
//   ?send=friday|sunday   post now, ignoring the time check (for testing)
//   ?find-chat=1          list groups the bot has been added to (to get TELEGRAM_CHAT_ID)

const TIME_ZONE = "America/Chicago";
const POST_AT: Record<ReminderKind, { weekday: string; hour: number }> = {
  friday: { weekday: "Fri", hour: 18 },
  sunday: { weekday: "Sun", hour: 7 },
};

function localNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return {
    weekday: parts.weekday as string,
    hour: Number(parts.hour),
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function shortDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

async function telegram(method: string, params: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET isn't set on this deployment. Add it in Vercel (tick Production) and redeploy." },
      { status: 503 }
    );
  }
  const given = (req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? req.nextUrl.searchParams.get("key") ?? "").trim();
  if (given !== secret) {
    return NextResponse.json(
      { error: "Not allowed: the key in the link doesn't match CRON_SECRET in Vercel." },
      { status: 401 }
    );
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.TELEGRAM_BOT_TOKEN || !serviceKey) {
    return NextResponse.json({ error: "Set TELEGRAM_BOT_TOKEN and SUPABASE_SERVICE_ROLE_KEY first." }, { status: 503 });
  }

  const params = req.nextUrl.searchParams;

  if (params.get("find-chat")) {
    const updates = await telegram("getUpdates", {});
    const chats = new Map<number, string>();
    for (const u of updates.result ?? []) {
      const chat = u.my_chat_member?.chat ?? u.message?.chat;
      if (chat && chat.type !== "private") chats.set(chat.id, chat.title);
    }
    return NextResponse.json({ chats: [...chats].map(([id, title]) => ({ id, title })) });
  }

  if (!process.env.TELEGRAM_CHAT_ID && !params.get("preview")) {
    return NextResponse.json({ error: "Set TELEGRAM_CHAT_ID first (use ?find-chat=1 to get it)." }, { status: 503 });
  }

  const now = localNow();
  const forced = params.get("send") as ReminderKind | null;
  let kind: ReminderKind | null = forced === "friday" || forced === "sunday" ? forced : null;
  if (!kind) {
    kind =
      (Object.keys(POST_AT) as ReminderKind[]).find(
        (k) => POST_AT[k].weekday === now.weekday && POST_AT[k].hour === now.hour
      ) ?? null;
  }
  if (!kind && params.get("preview")) kind = now.weekday === "Sun" ? "sunday" : "friday";
  if (!kind) {
    return NextResponse.json({ skipped: `Not a posting time (${now.weekday} ${now.hour}:00 Central).` });
  }

  // The Sunday this reminder is about: two days ahead on Friday, today on Sunday.
  const daysAhead = kind === "sunday" ? 0 : (7 - ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(now.weekday)) % 7;
  const sunday = addDays(now.date, daysAhead);

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sentKey = `telegram-reminder-${kind}-${now.date}`;
  if (!forced && !params.get("preview")) {
    const { data: already } = await db.from("settings").select("key").eq("key", sentKey).maybeSingle();
    if (already) return NextResponse.json({ skipped: "Already posted today." });
  }

  const [members, roles, assignments, availability] = await Promise.all([
    db.from("members").select("name").order("created_at"),
    db.from("roles").select("id, name").order("position"),
    db.from("assignments").select("role_id, member_name").eq("sunday", sunday),
    db.from("availability").select("member_name, status").eq("sunday", sunday),
  ]);
  const failed = [members, roles, assignments, availability].find((r) => r.error);
  if (failed?.error) {
    console.error("telegram-reminder read failed:", failed.error.message);
    return NextResponse.json({ error: "Couldn't read the schedule." }, { status: 500 });
  }

  const status: Record<string, string> = {};
  (availability.data ?? []).forEach((a) => (status[a.member_name] = a.status));
  const names = (members.data ?? []).map((m) => m.name);
  const byStatus = (s: string) => names.filter((n) => status[n] === s);

  const text = buildReminderText({
    kind,
    dateLabel: shortDate(sunday),
    lineup: (roles.data ?? []).map((r) => ({
      role: r.name,
      name: (assignments.data ?? []).filter((a) => a.role_id === r.id).map((a) => a.member_name).join(", ") || null,
    })),
    yes: byStatus("yes"),
    maybe: byStatus("maybe"),
    no: byStatus("no"),
    noReply: names.filter((n) => !status[n]),
    scheduleUrl: `${process.env.SITE_URL || req.nextUrl.origin}/schedule`,
  });

  if (params.get("preview")) return NextResponse.json({ kind, sunday, text });

  const result = await telegram("sendMessage", {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    disable_web_page_preview: true,
  });
  if (!result.ok) {
    console.error("telegram sendMessage failed:", result.description);
    const newId = result.parameters?.migrate_to_chat_id;
    if (newId) {
      return NextResponse.json(
        { error: `Telegram upgraded the group, so its ID changed. Set TELEGRAM_CHAT_ID to ${newId} in Vercel and redeploy.` },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: `Telegram refused: ${result.description}` }, { status: 502 });
  }

  if (!forced) await db.from("settings").upsert({ key: sentKey, value: new Date().toISOString() });
  return NextResponse.json({ posted: kind, sunday });
}
