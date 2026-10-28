import type { Priority } from "@/lib/types";

export function priorityChip(p: Priority): string {
  if (p === "high") return "chip bg-rose-500/15 text-rose-300";
  if (p === "medium") return "chip bg-amber-500/15 text-amber-300";
  return "chip bg-slate-500/15 text-slate-300";
}

export function priorityLabel(p: Priority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function toneChip(tone: "danger" | "warning" | "muted"): string {
  if (tone === "danger") return "chip bg-rose-500/15 text-rose-300";
  if (tone === "warning") return "chip bg-amber-500/15 text-amber-300";
  return "chip bg-slate-500/15 text-slate-300";
}

export function subjectColor(subject: string): string {
  const palette: Record<string, string> = {
    Algorithms: "bg-cobalt-500/15 text-[#7dd3ff]",
    "Physics I": "bg-electric-500/15 text-[#5cb8ff]",
    "World History": "bg-amber-500/15 text-amber-300",
    Statistics: "bg-indigo-500/15 text-indigo-300",
    "Calculus II": "bg-rose-500/15 text-rose-300",
    Chemistry: "bg-violet-500/15 text-violet-300",
    Other: "bg-slate-500/15 text-slate-300",
  };
  return palette[subject] ?? "bg-slate-500/15 text-slate-300";
}
