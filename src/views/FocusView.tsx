import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import type { AppData } from "@/lib/useAppData";
import { SUBJECTS } from "@/lib/sampleData";
import { fmtClock, fmtDateDay, fmtDuration } from "@/lib/format";
import { subjectColor } from "@/components/badges";

const PRESETS = [
  { label: "Pomodoro", min: 25 },
  { label: "Short", min: 15 },
  { label: "Deep", min: 50 },
];

export function FocusView({ data }: { data: AppData }) {
  const { sessions, addSession, deleteSession } = data;
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [durationMin, setDurationMin] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!running) { if (intervalRef.current) window.clearInterval(intervalRef.current); return; }
    startRef.current = Date.now();
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          const focused = elapsed + durationMin * 60;
          addSession({ subject, durationSec: durationMin * 60 });
          setElapsed(0); setRunning(false);
          window.clearInterval(intervalRef.current!); intervalRef.current = null;
          try { if ("Notification" in window && Notification.permission === "granted") new Notification("Focus session complete!", { body: `Nice work — ${fmtDuration(focused)} of ${subject}.` }); } catch { /* ignore */ }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, durationMin, subject]);

  const setPreset = (min: number) => { if (running) return; setDurationMin(min); setRemaining(min * 60); setElapsed(0); };
  const start = () => { if (remaining === 0) { setRemaining(durationMin * 60); setElapsed(0); } setRunning(true); if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {}); };
  const pause = () => { const sessionElapsed = (startRef.current ? Date.now() - startRef.current : 0) / 1000; setElapsed((e) => e + Math.max(0, Math.floor(sessionElapsed))); setRunning(false); };
  const reset = () => { setRunning(false); setRemaining(durationMin * 60); setElapsed(0); };

  const totalToday = useMemo(() => { const s = new Date(); s.setHours(0, 0, 0, 0); return sessions.filter((x) => x.date >= s.getTime()).reduce((sum, x) => sum + x.durationSec, 0); }, [sessions]);
  const totalAll = useMemo(() => sessions.reduce((sum, s) => sum + s.durationSec, 0), [sessions]);
  const recent = useMemo(() => sessions.slice(-12).reverse(), [sessions]);
  const progress = durationMin > 0 ? ((durationMin * 60 - remaining) / (durationMin * 60)) * 100 : 0;
  const circ = 2 * Math.PI * 130;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-serif text-2xl font-semibold text-[#e0eaff]">Focus Mode</h1>
        <p className="text-sm text-[#7891c0]">Run a timed study sprint. Completed sessions are saved to your stats.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center p-8 lg:col-span-2">
          <div className="mb-6 w-full max-w-xs">
            <label className="label" htmlFor="f-subject">Studying</label>
            <select id="f-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={running}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="relative flex h-[300px] w-[300px] items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="130" fill="none" stroke="rgb(30 48 96)" strokeWidth="14" />
              <circle cx="150" cy="150" r="130" fill="none" stroke="rgb(39 139 255)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ - (progress / 100) * circ}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
            </svg>
            <div className="flex flex-col items-center">
              <span className="font-mono text-5xl font-bold tabular-nums text-[#e0eaff]">{fmtClock(remaining)}</span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#5a72a0]">{running ? "in progress" : remaining === 0 ? "done" : "ready"}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setPreset(p.min)} disabled={running}
                className={`chip cursor-pointer border ${
                  durationMin === p.min
                    ? "border-cobalt-500 bg-cobalt-500/15 text-[#5cb8ff]"
                    : "border-[#1a3060]/60 bg-[#0C2042] text-[#7891c0] hover:bg-[#102A50]/50"
                } disabled:cursor-not-allowed disabled:opacity-50`}>
                {p.label} · {p.min}m
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            {!running ? (
              <button className="btn-primary px-6" onClick={start}><Play size={18} /> Start</button>
            ) : (
              <button className="btn px-6 bg-amber-500 text-white hover:bg-amber-600" onClick={pause}><Pause size={18} /> Pause</button>
            )}
            <button className="btn-ghost px-5" onClick={reset} aria-label="Reset timer"><RotateCcw size={16} /> Reset</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 heading-serif text-base font-semibold text-[#e0eaff]">Session stats</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-cobalt-500/10 px-4 py-3">
                <span className="text-sm text-[#5cb8ff]">Today</span>
                <span className="text-lg font-bold text-[#5cb8ff]">{fmtDuration(totalToday)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#081630] px-4 py-3">
                <span className="text-sm text-[#7891c0]">All time</span>
                <span className="text-lg font-bold text-[#e0eaff]">{fmtDuration(totalAll)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#081630] px-4 py-3">
                <span className="text-sm text-[#7891c0]">Sessions</span>
                <span className="text-lg font-bold text-[#e0eaff]">{sessions.length}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 heading-serif text-base font-semibold text-[#e0eaff]">Recent sessions</h2>
            {recent.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#5a72a0]">No sessions yet.</p>
            ) : (
              <ul className="space-y-2">
                {recent.map((s) => (
                  <li key={s.id} className="group flex items-center justify-between rounded-lg border border-[#1a3060]/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`chip ${subjectColor(s.subject)}`}>{s.subject}</span>
                      <span className="text-sm text-[#7891c0]">{fmtDuration(s.durationSec)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#5a72a0]">{fmtDateDay(s.date)}</span>
                      <button onClick={() => deleteSession(s.id)} className="rounded p-0.5 text-[#274074] opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100" aria-label="Delete session"><Trash2 size={13} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
