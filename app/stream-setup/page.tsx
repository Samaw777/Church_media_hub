"use client";

import { Fragment, useEffect, useState } from "react";
import { MonitorPlay, PlayCircle, Radio, Trash2, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/Ui";
import { OnAirArt } from "@/components/MediaArt";
import { IconTile } from "@/components/Graphics";
import { ScreenshotUpload } from "@/components/ScreenshotUpload";
import { STREAM_SETUP_GROUPS as STEPS } from "@/lib/knowledge";

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

      <div className="card p-5 mb-6">
        <SignalFlowDiagram />
      </div>

      <p className="text-sm text-muted mb-8 leading-relaxed max-w-2xl">
        These steps cover the direct Wirecast → YouTube path. Upload your own screenshot to any
        step below — real captures from your own setup will show up here for everyone.
      </p>

      <div className="space-y-8">
        {STEPS.map((group) => (
          <div key={group.group}>
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

function SignalFlowDiagram() {
  const nodes = [
    { label: "Camera + Mic", icon: Video },
    { label: "Wirecast", icon: MonitorPlay },
    { label: "RTMP", icon: Radio },
    { label: "YouTube Live", icon: PlayCircle },
  ];
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      {nodes.map((n, i) => {
        const last = i === nodes.length - 1;
        return (
          <Fragment key={n.label}>
            <div
              className="flex sm:flex-col items-center gap-3 sm:gap-2 px-4 py-3 rounded-xl border text-sm sm:min-w-28"
              style={{
                borderColor: last ? "var(--tally)" : "var(--border)",
                boxShadow: last ? "0 0 24px rgb(228 72 60 / 0.2)" : undefined,
              }}
            >
              <IconTile icon={n.icon} color={last ? "var(--tally)" : "var(--muted)"} />
              {n.label}
            </div>
            {!last && <span className="flow-line" />}
          </Fragment>
        );
      })}
    </div>
  );
}
