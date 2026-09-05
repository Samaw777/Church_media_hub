"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/Ui";

const STEPS = [
  {
    group: "In YouTube Studio",
    steps: [
      {
        title: "Create the live event",
        body: "Go to studio.youtube.com → Create → Go Live. Set the title, privacy (Public / Unlisted / Private) and, if you're scheduling ahead, the start time.",
      },
      {
        title: "Grab the stream key & server URL",
        body: "On the stream's setup page, open Stream Settings. Copy the Stream Key and Stream URL (RTMP server address) — you'll paste both into Wirecast. Treat the key like a password; anyone with it can stream to your channel.",
      },
    ],
  },
  {
    group: "In Wirecast",
    steps: [
      {
        title: "Open Output Settings",
        body: "Menu bar → Output → Output Settings. This is where Wirecast sends its program feed out to the internet.",
      },
      {
        title: "Add YouTube as a destination",
        body: "Click Add, then choose YouTube from the destination list and sign in with the church's Google account — Wirecast can pull your scheduled event automatically. If you'd rather connect manually, choose Custom RTMP instead and paste the Server URL into Address and the Stream Key into Stream.",
      },
      {
        title: "Match the encoding settings",
        body: "Set resolution/bitrate to YouTube's recommended values (1080p ≈ 4500–9000 Kbps, 720p ≈ 2500–4000 Kbps). Higher isn't better if your upload speed can't sustain it — that's what causes buffering.",
      },
      {
        title: "Start the broadcast",
        body: "Click Start in Wirecast's Output panel a few minutes before service. This sends video to YouTube's servers but doesn't make it public yet if the event is Unlisted — use that window to check picture and sound.",
      },
    ],
  },
  {
    group: "Going live",
    steps: [
      {
        title: "Confirm stream health",
        body: 'In YouTube Studio\'s Stream Health panel, look for a green "Excellent" or "Good" status before switching the event to Public / hitting Go Live.',
      },
      {
        title: "End cleanly afterward",
        body: "Click Stop in Wirecast, then End Stream in YouTube Studio. Ending only one side can leave the event stuck in a live-but-frozen state for viewers.",
      },
    ],
  },
];

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
        These steps cover the direct Wirecast → YouTube path. Add your own screenshots to any step
        below by pasting an image link (e.g. a Google Drive or Imgur link) — real captures from
        your own setup will show up here for everyone.
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
  step,
  image,
  onSetImage,
}: {
  n: number;
  step: { title: string; body: string };
  image?: string;
  onSetImage: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(image || "");

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

        {image && !editing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={step.title}
            className="max-w-full border border-border mb-3"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        )}

        {editing ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste screenshot image URL"
              className="flex-1 bg-bg border border-border px-3 py-1.5 text-sm outline-none focus:border-tally"
            />
            <button
              onClick={() => {
                onSetImage(url.trim());
                setEditing(false);
              }}
              className="text-sm px-3 py-1.5 bg-panel-2 border border-border"
            >
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-sm px-2 text-muted">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs flex items-center gap-1.5 text-muted-2 hover:text-muted">
            <ImageIcon size={13} /> {image ? "Replace screenshot" : "Add a screenshot"}
          </button>
        )}
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
