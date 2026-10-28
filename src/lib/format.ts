export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso + "T00:00:00");
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function dueLabel(iso: string): { text: string; tone: "danger" | "warning" | "muted" } {
  const d = daysUntil(iso);
  if (d < 0) return { text: `Overdue ${Math.abs(d)}d`, tone: "danger" };
  if (d === 0) return { text: "Due today", tone: "danger" };
  if (d === 1) return { text: "Due tomorrow", tone: "warning" };
  if (d <= 3) return { text: `Due in ${d}d`, tone: "warning" };
  return { text: `Due in ${d}d`, tone: "muted" };
}

export function fmtClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function fmtDateDay(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
