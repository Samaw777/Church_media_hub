export function getSundays(count: number): Date[] {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const diff = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + diff);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isToday(d: Date): boolean {
  return isoDate(d) === isoDate(new Date());
}

export function shortLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function timeLabel(t: string): string {
  return new Date(t).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
