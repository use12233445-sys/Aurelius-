import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Plus, Share2, Trash2, AlertCircle, User } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { SharedResource } from "@/lib/types";
import { SUBJECTS } from "@/lib/sampleData";
import { subjectColor } from "@/components/badges";
import { Modal } from "@/components/Modal";

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ShareView() {
  const [items, setItems] = useState<SharedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [filterSubject, setFilterSubject] = useState("All");

  const load = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setError("Sharing requires a database connection, which isn't available right now. Your local notes and assignments still work.");
      setLoading(false); return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("shared_resources").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) { setError("Could not load shared resources: " + error.message); return; }
    setItems((data as SharedResource[]) ?? []); setError("");
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("shared_resources").delete().eq("id", id);
    if (error) { setError("Could not delete: " + error.message); return; }
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const subjectsInUse = ["All", ...SUBJECTS.filter((s) => items.some((i) => i.subject === s))];
  const filtered = filterSubject === "All" ? items : items.filter((i) => i.subject === filterSubject);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-serif text-2xl font-semibold text-[#e0eaff]">Classmate Sharing</h1>
          <p className="text-sm text-[#7891c0]">A shared board of academic resources posted by classmates.</p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)} disabled={!supabaseConfigured}><Plus size={16} /> Share a resource</button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {subjectsInUse.map((s) => (
          <button key={s} onClick={() => setFilterSubject(s)}
            className={`chip cursor-pointer whitespace-nowrap border ${
              filterSubject === s
                ? "border-cobalt-500 bg-cobalt-500/15 text-[#5cb8ff]"
                : "border-[#1a3060]/60 bg-[#0C2042] text-[#7891c0] hover:bg-[#102A50]/50"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card py-16 text-center text-sm text-[#5a72a0]">Loading shared resources…</div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Share2 size={36} className="text-[#274074]" />
          <p className="mt-3 text-sm text-[#5a72a0]">No resources shared yet. Be the first to contribute.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="card group flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-semibold text-[#e0eaff]">{r.title}</h3>
                <span className={`chip shrink-0 ${subjectColor(r.subject)}`}>{r.subject}</span>
              </div>
              {r.description && <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-[#7891c0]">{r.description}</p>}
              <a href={r.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#5cb8ff] hover:text-[#7dd3ff]">
                <ExternalLink size={13} /> Open link
              </a>
              <div className="mt-3 flex items-center justify-between border-t border-[#1a3060]/40 pt-3">
                <span className="flex items-center gap-1.5 text-xs text-[#5a72a0]"><User size={12} /> {r.author} · {relTime(r.created_at)}</span>
                <button onClick={() => remove(r.id)} className="rounded p-1 text-[#274074] opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100" aria-label="Delete resource"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <ShareEditor onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
    </div>
  );
}

function ShareEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!supabase) return;
    if (!title.trim()) return setErr("Please enter a title.");
    if (!link.trim()) return setErr("Please paste a link.");
    if (!author.trim()) return setErr("Please enter your name.");
    let url = link.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    setSaving(true);
    const { error } = await supabase.from("shared_resources").insert({ title: title.trim(), subject, link: url, description: description.trim(), author: author.trim() });
    setSaving(false);
    if (error) return setErr("Could not save: " + error.message);
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Share a resource">
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="r-title">Title</label>
          <input id="r-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Khan Academy: Linear Algebra" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="r-subject">Subject</label>
            <select id="r-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="r-author">Your name</label>
            <input id="r-author" className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Alex" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="r-link">Link</label>
          <input id="r-link" className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="label" htmlFor="r-desc">Description (optional)</label>
          <textarea id="r-desc" className="input min-h-[90px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's helpful about this resource?" />
        </div>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "Sharing…" : "Share"}</button>
        </div>
      </div>
    </Modal>
  );
}
