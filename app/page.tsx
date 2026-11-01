"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, MapPin, PlayCircle, Quote, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSundays, isoDate, shortLabel } from "@/lib/dates";
import { useMember } from "@/components/MemberProvider";
import { Avatar, Panel, roleIcon, StatCard } from "@/components/Ui";
import { ProgressRing, SignalRings, StageLights } from "@/components/Graphics";

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

function countdownLabel(sunday: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((sunday.getTime() - today.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
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

  const myRoles = lineup.filter((l) => l.name === me).map((l) => l.role);
  const allDone = doneCount === totalItems && totalItems > 0;
  const pct = totalItems ? Math.round((doneCount / totalItems) * 100) : 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-6">
        <div className="min-w-0">
          <p className="eyebrow mb-1">{greeting()}</p>
          <h1 className="text-3xl truncate" style={{ fontFamily: "var(--font-head)" }}>
            Hey {me?.split(" ")[0]}.
          </h1>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted shrink-0 pb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-ok inline-block" />
          {onlineCount} online
        </span>
      </div>

      <div className="card relative overflow-hidden p-6 md:p-8 mb-3">
        <StageLights className="absolute inset-x-0 top-0 w-full h-full" />
        <SignalRings className="absolute top-0 right-0 h-72 w-72" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tally tally-dot" />
              This Sunday · {countdownLabel(thisSunday)}
            </p>
            <p className="text-4xl md:text-5xl mb-2" style={{ fontFamily: "var(--font-head)" }}>
              {shortLabel(thisSunday)}
            </p>
            <p className="text-sm text-muted mb-5">
              {myRoles.length > 0 ? (
                <>
                  You&apos;re on <span className="text-tally font-medium">{myRoles.join(" & ")}</span>
                </>
              ) : (
                "You're not assigned to a role yet"
              )}
            </p>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="btn btn-secondary whitespace-nowrap">
              <PlayCircle size={15} className="text-tally" /> Watch on YouTube{" "}
              <ExternalLink size={13} className="text-muted-2 hidden sm:inline" />
            </a>
          </div>
          <Link href="/checklist" title="Open the Sunday checklist" className="flex flex-col items-center gap-2 shrink-0">
            <ProgressRing pct={loading ? 0 : pct} size={92} />
            <span className="text-xs text-muted whitespace-nowrap">
              {loading ? "Checklist" : allDone ? "All done" : `${doneCount} of ${totalItems} done`}
            </span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <StatCard
          label="Available"
          value={`${yesCount}/${roster.length}`}
          sub="said they're in"
          tally="var(--ok)"
          href="/schedule"
          loading={loading}
          icon={Users}
        />
        <StatCard
          label="Checked in"
          value={`${checkedInCount}`}
          sub="on site so far"
          tally="var(--ok)"
          href="/schedule"
          loading={loading}
          icon={MapPin}
        />
        <StatCard
          label="Issues"
          value={`${openIssues}`}
          sub={openIssues > 0 ? "need attention" : "all clear"}
          tally={openIssues > 0 ? "var(--tally)" : "var(--ok)"}
          href="/troubleshooting"
          loading={loading}
          icon={openIssues > 0 ? AlertTriangle : ShieldCheck}
        />
      </div>

      <div className="mb-3">
        <Panel
          title="This Sunday's lineup"
          action={
            <Link href="/calendar" className="text-xs text-muted hover:text-text shrink-0">
              Full calendar →
            </Link>
          }
        >
          {lineup.length === 0 ? (
            <p className="text-sm text-muted-2">No roles set up yet — an admin can add some on the Calendar page.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {lineup.map((l) => {
                const RoleIcon = roleIcon(l.role);
                return (
                  <div key={l.role} className="flex items-center gap-3 min-w-0">
                    {l.name ? (
                      <Avatar name={l.name} highlight={l.name === me} />
                    ) : (
                      <span className="w-7 h-7 rounded-full border border-dashed border-border shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: l.name ? "var(--text)" : "var(--muted-2)" }}>
                        {l.name ?? "Open"}
                      </p>
                      <p className="text-xs text-muted-2 flex items-center gap-1 min-w-0">
                        <RoleIcon size={12} className="text-tally shrink-0" />
                        <span className="truncate">{l.role}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
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
                title={n}
                className="flex items-center gap-2 text-sm"
                style={{ color: n === me ? "var(--text)" : "var(--muted)" }}
              >
                <Avatar name={n} highlight={n === me} />
                {n}
              </span>
            ))}
            {roster.length === 0 && <span className="text-sm text-muted-2">No one&apos;s joined yet.</span>}
          </div>
        </Panel>
        <Panel title="Word for the team">
          <Quote size={22} className="text-tally mb-2" />
          <p className="text-sm text-muted leading-relaxed" style={{ fontFamily: "var(--font-head)" }}>
            {encouragementOfTheDay()}
          </p>
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
          className="field flex-1 min-w-0"
        />
        <button onClick={save} className="btn btn-secondary">
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
