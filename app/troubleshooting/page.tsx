"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { timeLabel } from "@/lib/dates";
import { useMember } from "@/components/MemberProvider";
import { PageHeader } from "@/components/Ui";
import { ScreenshotUpload } from "@/components/ScreenshotUpload";
import type { Issue } from "@/lib/types";
import { TROUBLESHOOTING } from "@/lib/knowledge";

export default function TroubleshootingPage() {
  const { me } = useMember();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [screenshotUrl, setScreenshotUrl] = useState("");

  async function loadIssues() {
    const { data } = await supabase.from("issues").select("*").order("created_at", { ascending: false });
    setIssues((data as Issue[]) ?? []);
  }

  useEffect(() => {
    loadIssues();
    const channel = supabase
      .channel("issues-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, loadIssues)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function submit() {
    if (!title.trim() || !me) return;
    await supabase.from("issues").insert({
      title: title.trim(),
      description: description.trim() || null,
      severity,
      reporter: me,
      status: "open",
      screenshot_url: screenshotUrl || null,
    });
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setScreenshotUrl("");
    setShowForm(false);
  }

  async function toggleStatus(issue: Issue) {
    const resolved = issue.status !== "resolved";
    await supabase
      .from("issues")
      .update({ status: resolved ? "resolved" : "open", resolved_at: resolved ? new Date().toISOString() : null })
      .eq("id", issue.id);
  }

  async function remove(id: string) {
    await supabase.from("issues").delete().eq("id", id);
  }

  const sorted = [...issues].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1));

  return (
    <div>
      <PageHeader eyebrow="Common problems & the log" title="Troubleshooting" />

      <h2 className="text-sm uppercase tracking-wide text-muted mb-3" style={{ fontFamily: "var(--font-mono)" }}>
        Quick fixes
      </h2>
      <div className="border border-border mb-8">
        {TROUBLESHOOTING.map((t, i) => (
          <div key={i} className="border-b last:border-b-0 border-border">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-panel"
            >
              <span className="flex items-center gap-3 text-sm">
                <AlertTriangle size={15} className="text-warn shrink-0" /> {t.q}
              </span>
              <ChevronDown
                size={16}
                className="transition-transform text-muted shrink-0"
                style={{ transform: openFaq === i ? "rotate(180deg)" : "none" }}
              />
            </button>
            {openFaq === i && <p className="px-5 pb-4 text-sm text-muted leading-relaxed max-w-2xl">{t.a}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wide text-muted" style={{ fontFamily: "var(--font-mono)" }}>
          Issue log
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm px-3 py-1.5 bg-tally text-[#160705] flex items-center gap-1.5"
        >
          <Plus size={14} /> Log an issue
        </button>
      </div>

      {showForm && (
        <div className="bg-panel border border-border p-5 mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What happened?"
            className="w-full bg-bg border border-border px-3 py-2 text-sm outline-none focus:border-tally mb-3"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details — what you tried, what fixed it (if anything)"
            rows={3}
            className="w-full bg-bg border border-border px-3 py-2 text-sm outline-none focus:border-tally mb-3 resize-none"
          />
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className="text-xs px-2.5 py-1 border capitalize"
                  style={{
                    borderColor: severity === s ? "var(--tally)" : "var(--border)",
                    color: severity === s ? "var(--tally)" : "var(--muted)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <ScreenshotUpload pathPrefix="issues" onUploaded={setScreenshotUrl} />
          </div>
          {screenshotUrl && (
            <div className="relative mb-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshotUrl} alt="Attached screenshot" className="max-h-40 border border-border" />
              <button
                onClick={() => setScreenshotUrl("")}
                className="absolute -top-2 -right-2 bg-panel border border-border text-muted-2 hover:text-tally"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={submit} className="text-sm px-4 py-2 bg-tally text-[#160705]">
              Submit
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && <p className="text-sm text-muted-2">No issues logged yet.</p>}
        {sorted.map((issue) => (
          <div
            key={issue.id}
            className="bg-panel border border-border px-5 py-4 flex items-start gap-4"
            style={{ borderLeft: `3px solid ${issue.status === "resolved" ? "var(--ok)" : "var(--tally)"}` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span style={{ fontFamily: "var(--font-head)" }}>{issue.title}</span>
                <span
                  className="text-xs px-1.5 py-0.5 uppercase text-muted-2"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {issue.severity}
                </span>
              </div>
              {issue.description && <p className="text-sm text-muted mb-2">{issue.description}</p>}
              {issue.screenshot_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={issue.screenshot_url}
                  alt={`Screenshot for ${issue.title}`}
                  className="max-h-48 border border-border mb-2"
                />
              )}
              <p className="text-xs text-muted-2">
                {issue.reporter} · {timeLabel(issue.created_at)} on {new Date(issue.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleStatus(issue)}
                className="text-xs px-2.5 py-1.5 border"
                style={{
                  borderColor: issue.status === "resolved" ? "var(--ok)" : "var(--border)",
                  color: issue.status === "resolved" ? "var(--ok)" : "var(--muted)",
                }}
              >
                {issue.status === "resolved" ? "Resolved" : "Mark resolved"}
              </button>
              <button onClick={() => remove(issue.id)} className="text-muted-2 hover:text-tally">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
