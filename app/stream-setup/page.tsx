"use client";

import { Fragment, useEffect, useState } from "react";
import {
  ArrowDown,
  CheckCircle2,
  ChevronDown,
  MonitorPlay,
  PlayCircle,
  Radio,
  Trash2,
  Video,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/Ui";
import { OnAirArt } from "@/components/MediaArt";
import { IconTile } from "@/components/Graphics";
import { ScreenshotUpload } from "@/components/ScreenshotUpload";
import { SIGNAL_FLOW_STAGES, STREAM_SETUP_GROUPS as STEPS, TROUBLESHOOTING } from "@/lib/knowledge";

export default function StreamSetupPage() {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .like("key", "stream-image-%")
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data ?? []).forEach((row) => (map[row.key] = row.value));
        setImages(map);
      });
  }, []);

  async function setImage(stepId: string, url: string) {
    const key = `stream-image-${stepId}`;
    setImages((prev) => ({ ...prev, [key]: url }));
    await supabase.from("settings").upsert({ key, value: url });
  }

  return (
    <div>
      <PageHeader eyebrow="Wirecast → YouTube" title="Live Stream Setup" icon={Radio} art={<OnAirArt />} />

      <div className="card p-5 mb-8">
        <SignalFlowDiagram />
      </div>

      <div className="space-y-8">
        {STEPS.map((group) => (
          <div key={group.group} id={groupAnchor(group.group)} className="scroll-mt-24">
            <h2 className="section-title mb-3">
              {group.group}
            </h2>
            <div className="space-y-3">
              {group.steps.map((s, i) => {
                const stepId = `${group.group}-${i}`.replace(/\s+/g, "-").toLowerCase();
                const key = `stream-image-${stepId}`;
                return (
                  <StepCard
                    key={stepId}
                    n={i + 1}
                    stepId={stepId}
                    step={s}
                    image={images[key]}
                    onSetImage={(url) => setImage(stepId, url)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCard({
  n,
  stepId,
  step,
  image,
  onSetImage,
}: {
  n: number;
  stepId: string;
  step: { title: string; body: string };
  image?: string;
  onSetImage: (url: string) => void;
}) {
  return (
    <div className="card p-5 flex gap-4">
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-panel-2 text-sm font-medium text-muted"
      >
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="mb-1.5" style={{ fontFamily: "var(--font-head)" }}>
          {step.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed mb-3">{step.body}</p>

        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={step.title}
            className="max-w-full rounded-lg border border-border mb-3"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        )}

        <div className="flex items-center gap-3">
          <ScreenshotUpload
            pathPrefix={`stream-setup/${stepId}`}
            label={image ? "Replace screenshot" : "Add a screenshot"}
            onUploaded={onSetImage}
          />
          {image && (
            <button
              onClick={() => onSetImage("")}
              className="text-xs flex items-center gap-1.5 text-muted-2 hover:text-tally"
            >
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const STAGE_ICONS: Record<string, LucideIcon> = {
  camera: Video,
  wirecast: MonitorPlay,
  rtmp: Radio,
  youtube: PlayCircle,
};

function groupAnchor(group: string) {
  return "steps-" + group.replace(/\s+/g, "-").toLowerCase();
}

function SignalFlowDiagram() {
  const [selected, setSelected] = useState<string | null>(null);
  const stage = SIGNAL_FLOW_STAGES.find((s) => s.id === selected);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {SIGNAL_FLOW_STAGES.map((n, i) => {
          const last = i === SIGNAL_FLOW_STAGES.length - 1;
          const active = n.id === selected;
          const lit = active || (last && !selected);
          return (
            <Fragment key={n.id}>
              <button
                type="button"
                onClick={() => setSelected(active ? null : n.id)}
                aria-expanded={active}
                aria-controls="stage-detail"
                className="flex sm:flex-col items-center gap-3 sm:gap-2 px-4 py-3 rounded-xl border text-sm sm:min-w-28 text-left sm:text-center transition-colors hover:bg-panel-2 focus-visible:outline-2"
                style={{
                  borderColor: lit ? "var(--tally)" : "var(--border)",
                  boxShadow: lit ? "0 0 24px rgb(228 72 60 / 0.2)" : undefined,
                  background: active ? "var(--panel-2)" : undefined,
                }}
              >
                <IconTile icon={STAGE_ICONS[n.id]} color={lit ? "var(--tally)" : "var(--muted)"} />
                <span className="flex-1 sm:flex-none">{n.label}</span>
                <ChevronDown
                  size={16}
                  className={`sm:hidden text-muted-2 transition-transform ${active ? "rotate-180" : ""}`}
                />
              </button>
              {active && (
                <div className="sm:hidden">
                  <StageDetail stage={n} />
                </div>
              )}
              {!last && <span className="flow-line" />}
            </Fragment>
          );
        })}
      </div>
      {stage ? (
        <div className="hidden sm:block mt-4">
          <StageDetail stage={stage} />
        </div>
      ) : (
        <p className="hidden sm:block mt-3 text-xs text-muted-2">Tap a stage to see what to check.</p>
      )}
    </div>
  );
}

function StageDetail({ stage }: { stage: (typeof SIGNAL_FLOW_STAGES)[number] }) {
  return (
    <div id="stage-detail" className="rounded-xl border border-border bg-panel-2 p-4 text-sm">
      <h3 className="text-xs uppercase tracking-wider text-muted-2 mb-2">What to check</h3>
      <ul className="space-y-1.5 mb-4">
        {stage.checks.map((c) => (
          <li key={c} className="flex gap-2">
            <CheckCircle2 size={16} className="text-ok shrink-0 mt-0.5" />
            <span>{c}</span>
          </li>
        ))}
      </ul>

      <h3 className="text-xs uppercase tracking-wider text-muted-2 mb-2">Common problems</h3>
      <div className="space-y-1.5">
        {stage.faq.map((i) => (
          <details key={i} className="group rounded-lg border border-border bg-panel px-3 py-2">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-2">
              {TROUBLESHOOTING[i].q}
              <ChevronDown size={14} className="text-muted-2 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-muted leading-relaxed">{TROUBLESHOOTING[i].a}</p>
          </details>
        ))}
      </div>

      {stage.group && (
        <a
          href={`#${groupAnchor(stage.group)}`}
          className="mt-4 inline-flex items-center gap-1 text-tally hover:underline"
        >
          Go to steps: {stage.group} <ArrowDown size={14} />
        </a>
      )}
    </div>
  );
}
