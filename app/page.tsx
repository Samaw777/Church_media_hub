"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Youtube } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSundays, isoDate, shortLabel } from "@/lib/dates";
import { useMember } from "@/components/MemberProvider";
import { Panel, StatCard } from "@/components/Ui";

const YOUTUBE_URL = "https://www.youtube.com/@zefcchurchtv2560";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted mb-1" style={{ fontFamily: "var(--font-mono)" }}>
        {greeting()}
      </p>
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
            <Youtube size={20} />
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
          sub="steps done"
          tally="var(--warn)"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
