// Static app content, shared between the pages that display it and the AI
// help chatbot (app/api/chat/route.ts) that answers questions grounded in it.

export const STREAM_SETUP_GROUPS = [
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

export const TROUBLESHOOTING = [
  {
    q: "No picture from a camera in Wirecast",
    a: "Check the cable at both ends first — HDMI/SDI connectors work loose easily. Then confirm the correct capture device is selected on that shot (right-click the shot → Camera). If it's still black, unplug and replug the capture device and restart Wirecast.",
  },
  {
    q: "Audio is out of sync with video",
    a: "Open the audio source's settings and adjust the delay in small steps (50–100ms) until it lines up. If it drifts over time rather than being consistently off, restart Wirecast before going live — that usually means a clock-drift issue between devices.",
  },
  {
    q: "Stream won't go live / YouTube shows no signal",
    a: "Re-check the stream key hasn't changed (YouTube issues a new one per scheduled event unless you're using a persistent key). Confirm Wirecast's Output Settings still has the right server URL and key, and that you clicked Start Broadcast in Wirecast, not just previewed it.",
  },
  {
    q: "Stream is choppy or keeps buffering",
    a: "This is almost always upload bandwidth. Move the streaming computer to wired ethernet, pause any other downloads/backups on the network, and lower Wirecast's output bitrate a step. Aim for upload speed at least 1.5x your stream's bitrate.",
  },
  {
    q: "Wirecast is lagging or crashes",
    a: "Close other GPU-heavy apps running on the same machine. Check Wirecast is updated. If it keeps happening, try lowering the output resolution or the number of live sources/layers on screen at once.",
  },
];

export const DEFAULT_CHECKLIST_ITEMS = [
  "Power on all cameras — confirm clean video in Wirecast",
  "Check audio levels from the soundboard feed",
  "Confirm Wirecast output is pointed at the right YouTube stream key",
  "Run a 5-minute test stream and check YouTube's health status",
  "Confirm lower-thirds / graphics are loaded and current",
  "Assign someone to watch YouTube chat during service",
  "Start local recording, if separate from the stream",
  "Go live at the scheduled time",
  "Double check: video + audio visible from a phone off-network",
];

export function buildKnowledgeBase(): string {
  const streamSetup = STREAM_SETUP_GROUPS.map(
    (g) => `${g.group}:\n` + g.steps.map((s, i) => `  ${i + 1}. ${s.title} — ${s.body}`).join("\n")
  ).join("\n\n");

  const troubleshooting = TROUBLESHOOTING.map((t) => `Q: ${t.q}\nA: ${t.a}`).join("\n\n");

  const checklist = DEFAULT_CHECKLIST_ITEMS.map((item, i) => `  ${i + 1}. ${item}`).join("\n");

  return [
    "=== Live Stream Setup Guide (Wirecast → YouTube) ===",
    streamSetup,
    "",
    "=== Troubleshooting FAQ ===",
    troubleshooting,
    "",
    "=== Sunday Pre-Service Checklist (default template) ===",
    checklist,
    "",
    "=== Other app features ===",
    "- Schedule page: mark yourself In/Maybe/Out for upcoming Sundays and check in when you arrive.",
    "- Calendar page: shows who is assigned to which role (Camera, Streaming, ProPresenter, Audio, Host, etc.) each Sunday. Only admins can build/edit it.",
    "- Checklist page: the pre-service checklist above, tracked per Sunday; only admins can edit the template itself, anyone can tick items off.",
    "- Troubleshooting page: this FAQ plus a shared issue log anyone can report problems to and mark resolved.",
  ].join("\n");
}
