import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react";
import type { AppData } from "@/lib/useAppData";
import type { Assignment, Priority } from "@/lib/types";
import { SUBJECTS } from "@/lib/sampleData";
import { dueLabel } from "@/lib/format";
import { priorityChip, priorityLabel, subjectColor, toneChip } from "@/components/badges";
import { ConfirmDialog, Modal } from "@/components/Modal";

type Filter = "all" | "active" | "completed";

export function AssignmentsView({ data }: { data: AppData }) {
  const { assignments, addAssignment, updateAssignment, deleteAssignment, toggleAssignment } = data;
  const [filter, setFilter] = useState<Filter>("active");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Assignment | null>(null);

  const filtered = useMemo(() => {
    return assignments
      .filter((a) => { if (filter === "active") return !a.completed; if (filter === "completed") return a.completed; return true; })
      .sort((a, b) => { if (a.completed !== b.completed) return a.completed ? 1 : -1; return a.dueDate.localeCompare(b.dueDate); });
  }, [assignments, filter]);

  const counts = {
    all: assignments.length,
    active: assignments.filter((a) => !a.completed).length,
    completed: assignments.filter((a) => a.completed).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="heading-serif text-2xl font-semibold text-[#e0eaff]">Assignments</h1>
          <p className="text-sm text-[#7891c0]">{counts.active} active · {counts.completed} completed</p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Add task</button>
      </div>

      <div className="inline-flex rounded-lg border border-[#1a3060]/60 bg-[#0C2042] p-1">
        {(["active", "all", "completed"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-cobalt-600 text-white" : "text-[#7891c0] hover:bg-[#102A50]/60"
            }`}>
            {f} <span className="opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays size={36} className="text-[#274074]" />
          <p className="mt-3 text-sm text-[#5a72a0]">{filter === "completed" ? "No completed tasks yet." : "No tasks here. Add one to get started."}</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((a) => {
            const due = dueLabel(a.dueDate);
            return (
              <li key={a.id} className={`card group flex items-center gap-3 p-4 ${a.completed ? "opacity-60" : ""}`}>
                <button onClick={() => toggleAssignment(a.id)} className="shrink-0 text-[#7891c0] hover:text-[#5cb8ff]" aria-label={a.completed ? "Mark as not done" : "Mark as done"}>
                  {a.completed ? <CheckCircle2 size={22} className="text-cobalt-500" /> : <Circle size={22} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${a.completed ? "text-[#5a72a0] line-through" : "text-[#e0eaff]"}`}>{a.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`chip ${subjectColor(a.subject)}`}>{a.subject}</span>
                    <span className={priorityChip(a.priority)}>{priorityLabel(a.priority)}</span>
                    <span className={toneChip(due.tone)}>{due.text}</span>
                    <span className="text-[#5a72a0]">{a.dueDate}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => setEditing(a)} className="rounded-md p-1.5 text-[#7891c0] hover:bg-[#102A50]/60 hover:text-[#5cb8ff]" aria-label="Edit task"><Pencil size={15} /></button>
                  <button onClick={() => setConfirmDelete(a)} className="rounded-md p-1.5 text-[#7891c0] hover:bg-rose-500/15 hover:text-rose-400" aria-label="Delete task"><Trash2 size={15} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(creating || editing) && (
        <AssignmentEditor initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(payload) => {
            if (editing) updateAssignment(editing.id, payload); else addAssignment(payload);
            setCreating(false); setEditing(null);
          }} />
      )}

      <ConfirmDialog open={!!confirmDelete} title="Delete task?" message={`"${confirmDelete?.title}" will be removed.`}
        onConfirm={() => { if (confirmDelete) deleteAssignment(confirmDelete.id); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

interface AssignmentEditorProps { initial: Assignment | null; onClose: () => void; onSave: (a: { title: string; subject: string; dueDate: string; priority: Priority }) => void; }

function AssignmentEditor({ initial, onClose, onSave }: AssignmentEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? SUBJECTS[0]);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!title.trim()) return setErr("Please enter a title.");
    if (!dueDate) return setErr("Please choose a due date.");
    onSave({ title: title.trim(), subject, dueDate, priority });
  };

  return (
    <Modal open onClose={onClose} title={initial ? "Edit task" : "Add task"}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="a-title">Title</label>
          <input id="a-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Problem Set 5" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="a-subject">Subject</label>
            <select id="a-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="a-due">Due date</label>
            <input id="a-due" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="a-priority">Priority</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  priority === p
                    ? "border-cobalt-500 bg-cobalt-500/15 text-[#5cb8ff]"
                    : "border-[#1a3060]/60 text-[#7891c0] hover:bg-[#102A50]/50"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Save</button>
        </div>
      </div>
    </Modal>
  );
}
