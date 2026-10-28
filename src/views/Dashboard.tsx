import {
  AlarmClock, BarChart3, BookOpen, CheckCircle2, Clock, Flame, TrendingUp, type LucideIcon,
} from "lucide-react";
import type { AppData } from "@/lib/useAppData";
import { fmtDateDay, fmtDuration, dueLabel } from "@/lib/format";
import { priorityChip, priorityLabel, subjectColor, toneChip } from "@/components/badges";
import type { ViewId } from "@/components/Sidebar";

interface DashboardProps {
  data: AppData;
  onNavigate: (v: ViewId) => void;
}

function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5a72a0]">{label}</p>
          <p className="text-xl font-bold text-[#e0eaff]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ data, onNavigate }: DashboardProps) {
  const { notes, assignments, sessions } = data;
  const upcoming = assignments.filter((a) => !a.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completed = assignments.filter((a) => a.completed).length;
  const overdue = assignments.filter((a) => !a.completed && dueLabel(a.dueDate).tone === "danger").length;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const todaySec = sessions.filter((s) => s.date >= todayMs).reduce((sum, s) => sum + s.durationSec, 0);
  const weekSec = sessions.filter((s) => s.date >= todayMs - 86400000 * 6).reduce((sum, s) => sum + s.durationSec, 0);

  const subjectTotals = new Map<string, number>();
  for (const s of sessions) subjectTotals.set(s.subject, (subjectTotals.get(s.subject) ?? 0) + s.durationSec);
  const subjectBars = [...subjectTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxBar = Math.max(1, ...subjectBars.map(([, v]) => v));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-serif text-3xl font-semibold text-[#e0eaff]">Dashboard</h1>
        <p className="text-sm text-[#7891c0]">
          Your study overview for {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={AlarmClock} label="Due soon" value={String(upcoming.length)} accent="bg-rose-500/15 text-rose-400" />
        <StatCard icon={CheckCircle2} label="Completed" value={String(completed)} accent="bg-cobalt-500/15 text-[#5cb8ff]" />
        <StatCard icon={Clock} label="Today" value={fmtDuration(todaySec)} accent="bg-electric-500/15 text-[#5cb8ff]" />
        <StatCard icon={Flame} label="Overdue" value={String(overdue)} accent="bg-amber-500/15 text-amber-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlarmClock size={18} className="text-[#5cb8ff]" />
              <h2 className="heading-serif text-base font-semibold text-[#e0eaff]">Upcoming assignments</h2>
            </div>
            <button className="btn-ghost text-xs" onClick={() => onNavigate("assignments")}>View all</button>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#5a72a0]">Nothing due — you're all caught up.</p>
          ) : (
            <ul className="divide-y divide-[#1a3060]/40">
              {upcoming.slice(0, 6).map((a) => {
                const due = dueLabel(a.dueDate);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#e0eaff]">{a.title}</p>
                      <p className="mt-0.5 text-xs text-[#5a72a0]">{a.subject}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={priorityChip(a.priority)}>{priorityLabel(a.priority)}</span>
                      <span className={toneChip(due.tone)}>{due.text}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#5cb8ff]" />
            <h2 className="heading-serif text-base font-semibold text-[#e0eaff]">Study by subject</h2>
          </div>
          {subjectBars.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#5a72a0]">No sessions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {subjectBars.map(([subject, sec]) => (
                <div key={subject}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className={`chip ${subjectColor(subject)}`}>{subject}</span>
                    <span className="font-medium text-[#7891c0]">{fmtDuration(sec)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#081630]">
                    <div className="h-full rounded-full bg-cobalt-500" style={{ width: `${(sec / maxBar) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-lg bg-[#081630] px-3 py-2.5 text-xs">
            <span className="flex items-center gap-1.5 text-[#7891c0]"><TrendingUp size={14} /> Last 7 days</span>
            <span className="font-semibold text-[#e0eaff]">{fmtDuration(weekSec)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-[#5cb8ff]" />
              <h2 className="heading-serif text-base font-semibold text-[#e0eaff]">Recent notes</h2>
            </div>
            <button className="btn-ghost text-xs" onClick={() => onNavigate("notes")}>Open notes</button>
          </div>
          {notes.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#5a72a0]">No notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {notes.slice(0, 4).map((n) => (
                <li key={n.id} className="rounded-lg border border-[#1a3060]/40 px-3 py-2.5 hover:bg-[#102A50]/50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[#e0eaff]">{n.title}</p>
                    <span className={`chip ${subjectColor(n.subject)}`}>{n.subject}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-[#5a72a0]">{n.content.replace(/\n/g, " ").slice(0, 80)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#5cb8ff]" />
              <h2 className="heading-serif text-base font-semibold text-[#e0eaff]">Recent focus sessions</h2>
            </div>
            <button className="btn-ghost text-xs" onClick={() => onNavigate("focus")}>Start timer</button>
          </div>
          {sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#5a72a0]">No sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice().reverse().slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg border border-[#1a3060]/40 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`chip ${subjectColor(s.subject)}`}>{s.subject}</span>
                    <span className="text-sm text-[#7891c0]">{fmtDuration(s.durationSec)}</span>
                  </div>
                  <span className="text-xs text-[#5a72a0]">{fmtDateDay(s.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
