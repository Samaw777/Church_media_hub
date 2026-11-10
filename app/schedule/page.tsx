"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Check, ChevronDown, HelpCircle, Loader2, X, type LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSundays, isoDate, isToday, shortLabel, timeLabel } from "@/lib/dates";
import { useMember } from "@/components/MemberProvider";
import { Avatar, PageHeader, roleIcon } from "@/components/Ui";
import { CrewArt } from "@/components/MediaArt";
import type { AvailabilityStatus } from "@/lib/types";

const SUNDAY_COUNT = 10;
const SHOWN_AT_FIRST = 4;
const STATUSES: AvailabilityStatus[] = ["yes", "maybe", "no"];

const AVAIL_META: Record<AvailabilityStatus, { label: string; group: string; color: string; ink: string; icon: LucideIcon }> = {
  yes: { label: "In", group: "In", color: "var(--ok)", ink: "#0a1f16", icon: Check },
  maybe: { label: "Maybe", group: "Maybe", color: "var(--warn)", ink: "#241703", icon: HelpCircle },
  no: { label: "Out", group: "Out", color: "var(--muted-2)", ink: "#0f1214", icon: X },
};

type ByDate<T> = Record<string, Record<string, T>>;
type SaveState = "saving" | "saved" | "error" | undefined;

function tap() {
  try {
    navigator.vibrate?.(10);
  } catch {}
}

export default function SchedulePage() {
  const { me, roster } = useMember();
  const sundays = useMemo(() => getSundays(SUNDAY_COUNT), []);
  const first = isoDate(sundays[0]);
  const last = isoDate(sundays[sundays.length - 1]);

  const [availability, setAvailability] = useState<ByDate<AvailabilityStatus>>({});
  const [checkins, setCheckins] = useState<ByDate<string>>({});
  const [myRoles, setMyRoles] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState<Record<string, SaveState>>({});
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchAll = useCallback(async () => {
    const [availRes, checkinRes, assignRes, rolesRes] = await Promise.all([
      supabase.from("availability").select("sunday, member_name, status").gte("sunday", first).lte("sunday", last),
      supabase.from("checkins").select("sunday, member_name, checked_in_at").gte("sunday", first).lte("sunday", last),
      supabase.from("assignments").select("sunday, role_id, member_name").gte("sunday", first).lte("sunday", last),
      supabase.from("roles").select("id, name"),
    ]);
    const avail: ByDate<AvailabilityStatus> = {};
    (availRes.data ?? []).forEach((r) => ((avail[r.sunday] ??= {})[r.member_name] = r.status as AvailabilityStatus));
    const checks: ByDate<string> = {};
    (checkinRes.data ?? []).forEach((r) => ((checks[r.sunday] ??= {})[r.member_name] = r.checked_in_at));
    const roleNames: Record<string, string> = {};
    (rolesRes.data ?? []).forEach((r) => (roleNames[r.id] = r.name));
    const mine: Record<string, string[]> = {};
    (assignRes.data ?? []).forEach((a) => {
      if (a.member_name === me && roleNames[a.role_id]) (mine[a.sunday] ??= []).push(roleNames[a.role_id]);
    });
    return { avail, checks, mine };
  }, [first, last, me]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      fetchAll().then(({ avail, checks, mine }) => {
        if (cancelled) return;
        setAvailability(avail);
        setCheckins(checks);
        setMyRoles(mine);
        setLoading(false);
      });
    refresh();
    // One live connection for the whole page: anyone's change shows up straight away.
    const filter = `sunday=gte.${first}`;
    const channel = supabase
      .channel("schedule")
      .on("postgres_changes", { event: "*", schema: "public", table: "availability", filter }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins", filter }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments", filter }, refresh)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [first, fetchAll]);

  async function setMine(sunday: string, status: AvailabilityStatus) {
    if (!me) return;
    tap();
    const previous = availability[sunday]?.[me];
    setAvailability((prev) => ({ ...prev, [sunday]: { ...prev[sunday], [me]: status } }));
    setSaving((prev) => ({ ...prev, [sunday]: "saving" }));
    const { error } = await supabase
      .from("availability")
      .upsert({ sunday, member_name: me, status }, { onConflict: "sunday,member_name" });
    if (error) {
      setAvailability((prev) => {
        const day = { ...prev[sunday] };
        if (previous) day[me] = previous;
        else delete day[me];
        return { ...prev, [sunday]: day };
      });
    }
    setSaving((prev) => ({ ...prev, [sunday]: error ? "error" : "saved" }));
  }

  async function checkIn(sunday: string) {
    if (!me) return;
    tap();
    const now = new Date().toISOString();
    setCheckins((prev) => ({ ...prev, [sunday]: { ...prev[sunday], [me]: now } }));
    await supabase
      .from("checkins")
      .upsert({ sunday, member_name: me, checked_in_at: now }, { onConflict: "sunday,member_name" });
  }

  const unanswered = me ? sundays.map(isoDate).filter((d) => !availability[d]?.[me]) : [];
  const shown = showAll ? sundays : sundays.slice(0, SHOWN_AT_FIRST);

  return (
    <div>
      <PageHeader eyebrow="Availability & check-in" title="Schedule" icon={Calendar} art={<CrewArt />} />

      {!loading && me && unanswered.length > 0 && (
        <div className="card p-4 mb-4">
          <p className="text-sm mb-3">
            <span className="font-medium">
              {unanswered.length} Sunday{unanswered.length === 1 ? "" : "s"}
            </span>{" "}
            <span className="text-muted">to reply to. Answer them all:</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((s) => {
              const Icon = AVAIL_META[s].icon;
              return (
                <button
                  key={s}
                  onClick={() => unanswered.forEach((d) => setMine(d, s))}
                  className="btn btn-secondary text-sm"
                >
                  <Icon size={15} style={{ color: AVAIL_META[s].color }} /> {AVAIL_META[s].label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {shown.map((d, i) => {
          const iso = isoDate(d);
          return (
            <SundayCard
              key={iso}
              date={d}
              next={i === 0 && !isToday(d)}
              roster={roster}
              me={me}
              loading={loading}
              availability={availability[iso] ?? {}}
              checkins={checkins[iso] ?? {}}
              myRoles={myRoles[iso] ?? []}
              saveState={saving[iso]}
              onSet={(s) => setMine(iso, s)}
              onCheckIn={() => checkIn(iso)}
            />
          );
        })}
      </div>

      {!showAll && sundays.length > SHOWN_AT_FIRST && (
        <button onClick={() => setShowAll(true)} className="btn btn-secondary w-full mt-4">
          Show {sundays.length - SHOWN_AT_FIRST} more Sundays <ChevronDown size={15} />
        </button>
      )}
    </div>
  );
}

function SundayCard({
  date,
  next,
  roster,
  me,
  loading,
  availability,
  checkins,
  myRoles,
  saveState,
  onSet,
  onCheckIn,
}: {
  date: Date;
  next: boolean;
  roster: string[];
  me: string | null;
  loading: boolean;
  availability: Record<string, AvailabilityStatus>;
  checkins: Record<string, string>;
  myRoles: string[];
  saveState: SaveState;
  onSet: (s: AvailabilityStatus) => void;
  onCheckIn: () => void;
}) {
  const today = isToday(date);
  const mine = me ? availability[me] : undefined;
  const iCheckedIn = !!(me && checkins[me]);
  const [showNoReply, setShowNoReply] = useState(false);

  const groups: Record<AvailabilityStatus | "none", string[]> = { yes: [], maybe: [], no: [], none: [] };
  roster.forEach((n) => groups[checkins[n] ? "yes" : availability[n] ?? "none"].push(n));
  const total = roster.length || 1;

  return (
    <div
      className="card overflow-hidden"
      style={{
        borderColor: today ? "var(--tally)" : undefined,
        boxShadow: today ? "0 0 32px rgb(228 72 60 / 0.14)" : undefined,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span style={{ fontFamily: "var(--font-head)" }} className="text-lg">
            {shortLabel(date)}
          </span>
          {today && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--tally)", color: "#160705" }}>
              Today
            </span>
          )}
          {next && <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted">Next</span>}
        </div>
        {today && me && (
          <button
            onClick={onCheckIn}
            disabled={iCheckedIn}
            className="btn"
            style={{
              background: iCheckedIn ? "var(--panel-2)" : "var(--ok)",
              color: iCheckedIn ? "var(--ok)" : "#0a1f16",
              border: iCheckedIn ? "1px solid var(--ok)" : "none",
            }}
          >
            {iCheckedIn ? (
              <>
                <Check size={14} /> Checked in {timeLabel(checkins[me])}
              </>
            ) : (
              "I'm here"
            )}
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {myRoles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {myRoles.map((r) => {
              const Icon = roleIcon(r);
              return (
                <span key={r} className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full" style={{ background: "rgb(228 72 60 / 0.12)", color: "var(--tally)" }}>
                  <Icon size={14} /> You&apos;re on {r}
                </span>
              );
            })}
          </div>
        )}

        {me && (
          <div>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={`Your availability for ${shortLabel(date)}`}>
              {STATUSES.map((s) => {
                const meta = AVAIL_META[s];
                const Icon = meta.icon;
                const on = mine === s;
                return (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={on}
                    disabled={loading}
                    onClick={() => onSet(s)}
                    className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-medium border transition-all active:scale-[0.97]"
                    style={{
                      background: on ? meta.color : "transparent",
                      borderColor: on ? meta.color : "var(--border)",
                      color: on ? meta.ink : "var(--muted)",
                    }}
                  >
                    <Icon size={16} /> {meta.label}
                  </button>
                );
              })}
            </div>
            <p className="h-4 mt-1.5 text-xs" aria-live="polite">
              {saveState === "saving" && (
                <span className="text-muted-2 inline-flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Saving
                </span>
              )}
              {saveState === "saved" && <span className="text-ok inline-flex items-center gap-1"><Check size={12} /> Saved</span>}
              {saveState === "error" && <span className="text-tally">Couldn&apos;t save. Check your connection and tap again.</span>}
              {!saveState && !mine && !loading && <span className="text-muted-2">Tap to reply</span>}
            </p>
          </div>
        )}

        <div>
          <div className="flex h-2 rounded-full overflow-hidden bg-panel-2" aria-hidden>
            {STATUSES.map((s) => (
              <span key={s} style={{ width: `${(groups[s].length / total) * 100}%`, background: AVAIL_META[s].color }} />
            ))}
          </div>
          <p className="text-xs text-muted mt-2">
            <span className="text-ok">{groups.yes.length} in</span> · {groups.maybe.length} maybe · {groups.no.length} out ·{" "}
            {groups.none.length} no reply
          </p>
        </div>

        {STATUSES.map(
          (s) =>
            groups[s].length > 0 && (
              <PeopleRow key={s} label={AVAIL_META[s].group} color={AVAIL_META[s].color} names={groups[s]} me={me} checkins={checkins} />
            )
        )}

        {groups.none.length > 0 &&
          (showNoReply ? (
            <PeopleRow label="No reply" color="var(--muted-2)" names={groups.none} me={me} checkins={checkins} />
          ) : (
            <button onClick={() => setShowNoReply(true)} className="text-xs text-muted-2 hover:text-text inline-flex items-center gap-1">
              {groups.none.length} haven&apos;t replied <ChevronDown size={13} />
            </button>
          ))}
      </div>
    </div>
  );
}

function PeopleRow({
  label,
  color,
  names,
  me,
  checkins,
}: {
  label: string;
  color: string;
  names: string[];
  me: string | null;
  checkins: Record<string, string>;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color }}>
        {label} · {names.length}
      </p>
      <div className="flex flex-wrap gap-2">
        {names.map((n) => (
          <span
            key={n}
            className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-panel-2 text-sm"
            style={{ outline: n === me ? "1px solid var(--tally)" : undefined }}
          >
            <Avatar name={n} highlight={n === me} />
            {n === me ? "You" : n}
            {checkins[n] && <span className="text-xs text-ok">on site {timeLabel(checkins[n])}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
