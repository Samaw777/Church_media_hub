"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSundays, isoDate, isToday, shortLabel, timeLabel } from "@/lib/dates";
import { useMember } from "@/components/MemberProvider";
import { PageHeader } from "@/components/Ui";
import type { AvailabilityStatus } from "@/lib/types";

const AVAIL_META: Record<AvailabilityStatus, { label: string; color: string }> = {
  yes: { label: "In", color: "var(--ok)" },
  maybe: { label: "Maybe", color: "var(--warn)" },
  no: { label: "Out", color: "var(--muted-2)" },
};

export default function SchedulePage() {
  const { roster } = useMember();
  const sundays = getSundays(5);

  return (
    <div>
      <PageHeader eyebrow="Availability & check-in" title="Schedule" />
      <div className="space-y-4">
        {sundays.map((d) => (
          <SundayCard key={isoDate(d)} date={d} roster={roster} />
        ))}
      </div>
    </div>
  );
}

function SundayCard({ date, roster }: { date: Date; roster: string[] }) {
  const { me } = useMember();
  const sundayIso = isoDate(date);
  const today = isToday(date);

  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [checkins, setCheckins] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [availRes, checkinRes] = await Promise.all([
        supabase.from("availability").select("member_name, status").eq("sunday", sundayIso),
        supabase.from("checkins").select("member_name, checked_in_at").eq("sunday", sundayIso),
      ]);
      if (cancelled) return;
      const availMap: Record<string, AvailabilityStatus> = {};
      (availRes.data ?? []).forEach((r) => (availMap[r.member_name] = r.status as AvailabilityStatus));
      const checkinMap: Record<string, string> = {};
      (checkinRes.data ?? []).forEach((r) => (checkinMap[r.member_name] = r.checked_in_at));
      setAvailability(availMap);
      setCheckins(checkinMap);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`sunday-${sundayIso}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "availability", filter: `sunday=eq.${sundayIso}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins", filter: `sunday=eq.${sundayIso}` }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sundayIso]);

  async function setMyAvailability(status: AvailabilityStatus) {
    if (!me) return;
    setAvailability((prev) => ({ ...prev, [me]: status }));
    await supabase
      .from("availability")
      .upsert({ sunday: sundayIso, member_name: me, status }, { onConflict: "sunday,member_name" });
  }

  async function checkIn() {
    if (!me) return;
    const now = new Date().toISOString();
    setCheckins((prev) => ({ ...prev, [me]: now }));
    await supabase
      .from("checkins")
      .upsert({ sunday: sundayIso, member_name: me, checked_in_at: now }, { onConflict: "sunday,member_name" });
  }

  const iCheckedIn = !!(me && checkins[me]);

  return (
    <div
      className="bg-panel border border-border"
      style={{ borderLeft: `3px solid ${today ? "var(--tally)" : "var(--border)"}` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: "var(--font-head)" }} className="text-lg">
            {shortLabel(date)}
          </span>
          {today && (
            <span
              className="text-xs px-2 py-0.5"
              style={{ background: "var(--tally)", color: "#160705", fontFamily: "var(--font-mono)" }}
            >
              TODAY
            </span>
          )}
        </div>
        {today && (
          <button
            onClick={checkIn}
            disabled={iCheckedIn}
            className="text-sm px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
            style={{
              background: iCheckedIn ? "var(--panel-2)" : "var(--ok)",
              color: iCheckedIn ? "var(--ok)" : "#0a1f16",
              border: iCheckedIn ? "1px solid var(--ok)" : "none",
            }}
          >
            {iCheckedIn ? (
              <>
                <Check size={14} /> Checked in {timeLabel(checkins[me!])}
              </>
            ) : (
              "Check in"
            )}
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        {!loading && me && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(["yes", "maybe", "no"] as AvailabilityStatus[]).map((v) => (
              <button
                key={v}
                onClick={() => setMyAvailability(v)}
                className="text-sm px-3 py-1.5 border transition-colors"
                style={{
                  borderColor: availability[me] === v ? AVAIL_META[v].color : "var(--border)",
                  color: availability[me] === v ? AVAIL_META[v].color : "var(--muted)",
                }}
              >
                {AVAIL_META[v].label}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {roster.map((n) => {
            const v = availability[n];
            const checkedIn = !!checkins[n];
            return (
              <div key={n} className="flex items-center gap-1.5 text-sm">
                <span style={{ color: n === me ? "var(--text)" : "var(--muted)" }}>{n}</span>
                {checkedIn ? (
                  <span className="text-xs text-ok">on site</span>
                ) : v ? (
                  <span className="text-xs" style={{ color: AVAIL_META[v].color }}>
                    {AVAIL_META[v].label.toLowerCase()}
                  </span>
                ) : (
                  <span className="text-xs text-muted-2">no reply</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
