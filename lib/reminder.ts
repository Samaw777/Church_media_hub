// Builds the weekly Telegram reminder posted to the team group (see
// app/api/telegram-reminder/route.ts). Plain text, one emoji, easy to scan on a phone.

export type ReminderKind = "friday" | "sunday";

export type ReminderData = {
  kind: ReminderKind;
  dateLabel: string; // e.g. "Nov 15"
  lineup: { role: string; name: string | null }[];
  yes: string[];
  maybe: string[];
  no: string[];
  noReply: string[];
  scheduleUrl: string;
};

function line(label: string, names: string[]) {
  return names.length ? `${label} (${names.length}): ${names.join(", ")}` : null;
}

export function buildReminderText(d: ReminderData): string {
  const title = d.kind === "sunday" ? `📅 Today · ${d.dateLabel}` : `📅 This Sunday · ${d.dateLabel}`;

  const serving = d.lineup.length
    ? d.lineup.map((l) => `${l.role}: ${l.name ?? "needs someone"}`)
    : ["No roles set up yet"];

  const coming = [
    line("In", d.yes),
    line("Maybe", d.maybe),
    line("Out", d.no),
    line("No reply yet", d.noReply),
  ].filter(Boolean) as string[];

  const closing =
    d.kind === "sunday"
      ? `Check in when you arrive:\n${d.scheduleUrl}`
      : d.noReply.length
        ? `Please reply in the app if you haven't:\n${d.scheduleUrl}`
        : `Change your reply in the app:\n${d.scheduleUrl}`;

  return [title, "", "Who's serving", ...serving, "", "Who's coming", ...coming, "", closing].join("\n");
}
