"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSundays, isoDate, shortLabel } from "@/lib/dates";
import { useMember } from "@/components/MemberProvider";
import { Panel, StatCard } from "@/components/Ui";

const YOUTUBE_URL = "https://www.youtube.com/@zefcchurchtv2560";

const ENCOURAGEMENTS = [
  "\"Whatever you do, work at it with all your heart, as working for the Lord.\" — Colossians 3:23",
  "\"Each of you should use whatever gift you have received to serve others.\" — 1 Peter 4:10",
  "\"Let your light shine before others.\" — Matthew 5:16",
  "\"Do everything without grumbling or arguing.\" — Philippians 2:14",
  "\"Whatever you do, do it all for the glory of God.\" — 1 Corinthians 10:31",
  "\"Be strong and courageous... the Lord your God will be with you wherever you go.\" — Joshua 1:9",
  "\"Serve wholeheartedly, as if you were serving the Lord.\" — Ephesians 6:7",
  "\"Give thanks in all circumstances.\" — 1 Thessalonians 5:18",
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function encouragementOfTheDay() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return ENCOURAGEMENTS[dayOfYear % ENCOURAGEMENTS.length];
}

export default function HomePage() {
  const { me, roster } = useMember();
  const thisSunday = getSundays(1)[0];
  const sundayIso = isoDate(thisSunday);

  const [yesCount, setYesCount] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [openIssues, setOpenIssues] = useState(0);
  const [chatLink, setChatLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [lineup, setLineup] = useState<{ role: string; name: string | null }[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [avail, checkins, items, state, issues, setting] = await Promise.all([
        supabase.from("availability").select("status").eq("sunday", sundayIso),
        supabase.from("checkins").select("member_name").eq("sunday", sundayIso),
        supabase.from("checklist_items").select("id"),
        supabase.from("checklist_state").select("done").eq("sunday", sundayIso).eq("done", true),
        supabase.from("issues").select("id").eq("status", "open"),
        supabase.from("settings").select("value").eq("key", "chat-link").maybeSingle(),
      ]);
      if (cancelled) return;
      setYesCount((avail.data ?? []).filter((a) => a.status === "yes").length);
      setCheckedInCount((checkins.data ?? []).length);
      setTotalItems((items.data ?? []).length);
      setDoneCount((state.data ?? []).length);
      setOpenIssues((issues.data ?? []).length);
      setChatLink(setting.data?.value ?? "");
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sundayIso]);

  useEffect(() => {
    let cancelled = false;
    async function loadLineup() {
      const [rolesRes, assignRes] = await Promise.all([
        supabase.from("roles").select("id, name").order("position"),
        supabase.from("assignments").select("role_id, member_name").eq("sunday", sundayIso),
      ]);
      if (cancelled) return;
      const assignMap: Record<string, string> = {};
      (assignRes.data ?? []).forEach((a) => (assignMap[a.role_id] = a.member_name));
      setLineup((rolesRes.data ?? []).map((r) => ({ role: r.name, name: assignMap[r.id] ?? null })));
    }
    loadLineup();

    const channel = supabase
      .channel(`home-lineup-${sundayIso}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter: `sunday=eq.${sundayIso}` }, loadLineup)
      .on("postgres_changes", { event: "*", schema: "public", table: "roles" }, loadLineup)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sundayIso]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel("presence:online", { config: { presence: { key: me } } });
    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-xs uppercase tracking-wide text-muted" style={{ fontFamily: "var(--font-mono)" }}>
          {greeting()}
        </p>
        <span
          className="flex items-center gap-1.5 text-xs text-muted-2 shrink-0"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-ok inline-block" />
          {onlineCount} online now
        </span>
      </div>
      <h1 className="text-3xl mb-6" style={{ fontFamily: "var(--font-head)" }}>
        Hey {me?.split(" ")[0]}.
      </h1>

      <a
        href={YOUTUBE_URL}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center justify-between gap-4 bg-panel border border-border hover:border-tally transition-colors px-6 py-5 mb-8"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 flex items-center justify-center bg-panel-2 border border-border text-tally shrink-0">
            <PlayCircle size={20} />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs uppercase tracking-wide text-muted-2 mb-0.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Live & on demand
            </p>
            <p className="text-lg truncate" style={{ fontFamily: "var(--font-head)" }}>
              Watch on YouTube
            </p>
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted group-hover:text-tally transition-colors shrink-0">
          Open channel <ExternalLink size={14} />
        </span>
      </a>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="This Sunday"
          value={shortLabel(thisSunday)}
          sub={`${yesCount} of ${roster.length} available`}
          tally="var(--ok)"
          href="/schedule"
          loading={loading}
        />
        <StatCard
          label="Checked in"
          value={`${checkedInCount}`}
          sub="on site so far"
          tally="var(--ok)"
          href="/schedule"
          loading={loading}
        />
        <StatCard
          label="Checklist"
          value={`${doneCount}/${totalItems}`}
          sub={doneCount === totalItems && totalItems > 0 ? "all done 🎉" : "steps done"}
          tally={doneCount === totalItems && totalItems > 0 ? "var(--ok)" : "var(--warn)"}
          href="/checklist"
          loading={loading}
        />
        <StatCard
          label="Open issues"
          value={`${openIssues}`}
          sub="need attention"
          tally={openIssues > 0 ? "var(--tally)" : "var(--ok)"}
          href="/troubleshooting"
          loading={loading}
        />
      </div>

      <div className="mb-3">
        <Panel
          title={`This Sunday's Lineup — ${shortLabel(thisSunday)}`}
          action={
            <Link href="/calendar" className="text-xs text-muted hover:text-text">
              Full calendar →
            </Link>
          }
        >
          {lineup.length === 0 ? (
            <p className="text-sm text-muted-2">No roles set up yet — an admin can add some on the Calendar page.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {lineup.map((l) => (
                <div key={l.role} className="flex items-center gap-2 px-3 py-2 bg-panel-2 border border-border text-sm">
                  <span className="text-muted-2 text-xs uppercase" style={{ fontFamily: "var(--font-mono)" }}>
                    {l.role}
                  </span>
                  <span
                    style={{
                      color: l.name === me ? "var(--tally)" : l.name ? "var(--text)" : "var(--muted-2)",
                      fontWeight: l.name === me ? 600 : 400,
                    }}
                  >
                    {l.name ?? "Open"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Panel title="Team">
          <div className="flex flex-wrap gap-2">
            {roster.map((n) => (
              <span
                key={n}
                className="px-3 py-1.5 text-sm bg-panel-2 border border-border"
                style={{ color: n === me ? "var(--text)" : "var(--muted)" }}
              >
                {n}
              </span>
            ))}
            {roster.length === 0 && <span className="text-sm text-muted-2">No one&apos;s joined yet.</span>}
          </div>
        </Panel>
        <Panel title="Word for the team">
          <p className="text-sm text-muted leading-relaxed italic">{encouragementOfTheDay()}</p>
        </Panel>
        <Panel title="Group chat">
          <p className="text-sm text-muted mb-3 leading-relaxed">
            Chat lives outside this app for now — WhatsApp or Slack. Drop the invite link here so
            the team can find it.
          </p>
          <ChatLinkEditor initial={chatLink} />
        </Panel>
      </div>
    </div>
  );
}

function ChatLinkEditor({ initial }: { initial: string }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);

  useEffect(() => setDraft(initial), [initial]);

  async function save() {
    await supabase.from("settings").upsert({ key: "chat-link", value: draft.trim() });
    setSaved(draft.trim());
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          className="flex-1 bg-bg border border-border px-3 py-2 text-sm outline-none focus:border-tally"
        />
        <button onClick={save} className="px-3 py-2 text-sm bg-panel-2 border border-border hover:border-muted">
          Save
        </button>
      </div>
      {saved && (
        <a
          href={saved}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-ok"
        >
          Open group chat <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}
