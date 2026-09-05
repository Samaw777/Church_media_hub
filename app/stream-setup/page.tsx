"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/Ui";
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
      <PageHeader eyebrow="Wirecast → YouTube" title="Live Stream Setup" />

      <div className="bg-panel border border-border p-5 mb-6">
        <SignalFlowDiagram />
      </div>

      <p className="text-sm text-muted mb-8 leading-relaxed max-w-2xl">
        These steps cover the direct Wirecast → YouTube path. Upload your own screenshot to any
        step below — real captures from your own setup will show up here for everyone.
      </p>

      <div className="space-y-8">
        {STEPS.map((group) => (
          <div key={group.group}>
            <h2 className="text-sm uppercase tracking-wide text-muted mb-3" style={{ fontFamily: "var(--font-mono)" }}>
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
    <div className="bg-panel border border-border p-5 flex gap-4">
      <div
        className="shrink-0 w-8 h-8 flex items-center justify-center border border-border text-sm text-muted"
        style={{ fontFamily: "var(--font-mono)" }}
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
            className="max-w-full border border-border mb-3"
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
  const nodes = ["Camera + Mic", "Wirecast", "RTMP", "YouTube Live"];
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      {nodes.map((n, i) => (
        <div key={n} className="flex items-center gap-3">
          <div
            className="px-4 py-3 border text-sm text-center"
            style={{
              borderColor: i === nodes.length - 1 ? "var(--tally)" : "var(--border)",
              color: i === nodes.length - 1 ? "var(--tally)" : "var(--text)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {n}
          </div>
          {i < nodes.length - 1 && <ArrowRight size={16} className="text-muted-2" />}
        </div>
      ))}
    </div>
  );
}
