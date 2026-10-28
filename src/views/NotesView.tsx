import { useMemo, useState } from "react";
import { BookPlus, Pencil, Search, Trash2, BookOpen } from "lucide-react";
import type { AppData } from "@/lib/useAppData";
import type { Note } from "@/lib/types";
import { SUBJECTS } from "@/lib/sampleData";
import { subjectColor } from "@/components/badges";
import { ConfirmDialog, Modal } from "@/components/Modal";

export function NotesView({ data }: { data: AppData }) {
  const { notes, addNote, updateNote, deleteNote } = data;
  const [query, setQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("All");
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);

  const subjectsInUse = useMemo(() => {
    const set = new Set(notes.map((n) => n.subject));
    return ["All", ...SUBJECTS.filter((s) => set.has(s) || s === "Other")];
  }, [notes]);

  const filtered = notes.filter((n) => {
    if (filterSubject !== "All" && n.subject !== filterSubject) return false;
    if (query) {
      const q = query.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const n of filtered) { const arr = map.get(n.subject) ?? []; arr.push(n); map.set(n.subject, arr); }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-serif text-2xl font-semibold text-[#e0eaff]">Class Notes</h1>
          <p className="text-sm text-[#7891c0]">{notes.length} note{notes.length === 1 ? "" : "s"} across {grouped.length} subject{grouped.length === 1 ? "" : "s"}.</p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}><BookPlus size={16} /> New note</button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5a72a0]" />
          <input className="input pl-9" placeholder="Search notes…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search notes" />
        </div>
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
      </div>

      {grouped.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <BookOpen size={36} className="text-[#274074]" />
          <p className="mt-3 text-sm text-[#5a72a0]">No notes found. Create your first note to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([subject, items]) => (
            <div key={subject}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`chip ${subjectColor(subject)}`}>{subject}</span>
                <span className="text-xs text-[#5a72a0]">{items.length}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((n) => (
                  <div key={n.id} className="card group flex flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-sm font-semibold text-[#e0eaff]">{n.title}</h3>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => setEditing(n)} className="rounded-md p-1 text-[#7891c0] hover:bg-[#102A50]/60 hover:text-[#5cb8ff]" aria-label="Edit note"><Pencil size={14} /></button>
                        <button onClick={() => setConfirmDelete(n)} className="rounded-md p-1 text-[#7891c0] hover:bg-rose-500/15 hover:text-rose-400" aria-label="Delete note"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-line text-xs leading-relaxed text-[#7891c0]">{n.content}</p>
                    <p className="mt-3 text-[11px] text-[#5a72a0]">Updated {new Date(n.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <NoteEditor initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(payload) => {
            if (editing) updateNote(editing.id, payload); else addNote(payload);
            setCreating(false); setEditing(null);
          }} />
      )}

      <ConfirmDialog open={!!confirmDelete} title="Delete note?" message={`"${confirmDelete?.title}" will be permanently removed.`}
        onConfirm={() => { if (confirmDelete) deleteNote(confirmDelete.id); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

interface NoteEditorProps { initial: Note | null; onClose: () => void; onSave: (n: { title: string; subject: string; content: string }) => void; }

function NoteEditor({ initial, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? SUBJECTS[0]);
  const [content, setContent] = useState(initial?.content ?? "");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!title.trim()) return setErr("Please enter a title.");
    if (!content.trim()) return setErr("Please enter some content.");
    onSave({ title: title.trim(), subject, content: content.trim() });
  };

  return (
    <Modal open onClose={onClose} title={initial ? "Edit note" : "New note"}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="note-title">Title</label>
          <input id="note-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Derivatives rules" autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="note-subject">Subject</label>
          <select id="note-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="note-content">Content</label>
          <textarea id="note-content" className="input min-h-[180px] resize-y font-[inherit]" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your note…" />
        </div>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Save note</button>
        </div>
      </div>
    </Modal>
  );
}
