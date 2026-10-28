import { useMemo, useState, useRef } from "react";
import {
  BookPlus, Pencil, Search, Trash2, BookOpen, Tag,
  Clock, ArrowUpDown, X, Check, Eye, Code,
  Bold, Italic, Heading2, List, Quote, ShieldCheck, Database
} from "lucide-react";
import type { AppData } from "@/lib/useAppData";
import type { Note } from "@/lib/types";
import { SUBJECTS } from "@/lib/sampleData";
import { subjectColor } from "@/components/badges";
import { ConfirmDialog, Modal } from "@/components/Modal";

type SortOption = "updated_desc" | "updated_asc" | "title_asc" | "title_desc";

export function NotesView({ data }: { data: AppData }) {
  const { notes, addNote, updateNote, deleteNote, notesStorageMode } = data;
  const [query, setQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("All");
  const [filterTag, setFilterTag] = useState<string>("All");
  const [sortOption, setSortOption] = useState<SortOption>("updated_desc");
  const [editing, setEditing] = useState<Note | null>(null);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);

  // Available subjects
  const subjectsInUse = useMemo(() => {
    const set = new Set(notes.map((n) => n.subject));
    return ["All", ...Array.from(new Set([...SUBJECTS, ...set]))];
  }, [notes]);

  // Available tags
  const tagsInUse = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set).sort()];
  }, [notes]);

  // Filter and sort notes
  const filtered = useMemo(() => {
    return notes
      .filter((n) => {
        if (filterSubject !== "All" && n.subject !== filterSubject) return false;
        if (filterTag !== "All" && (!n.tags || !n.tags.includes(filterTag))) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchSubject = n.subject.toLowerCase().includes(q);
          const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
          return matchTitle || matchContent || matchSubject || matchTag;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === "updated_desc") return b.updatedAt - a.updatedAt;
        if (sortOption === "updated_asc") return a.updatedAt - b.updatedAt;
        if (sortOption === "title_asc") return a.title.localeCompare(b.title);
        if (sortOption === "title_desc") return b.title.localeCompare(a.title);
        return 0;
      });
  }, [notes, filterSubject, filterTag, query, sortOption]);

  const handleSaved = () => {
    setCreating(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a3060]/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="heading-serif text-3xl font-semibold text-[#e0eaff]">Class Notes</h1>
            <span className="flex items-center gap-1 rounded-full border border-cobalt-500/30 bg-cobalt-500/10 px-2.5 py-0.5 text-[11px] font-medium text-[#5cb8ff]">
              {notesStorageMode === "cloud" ? (
                <>
                  <Database size={11} className="text-[#5cb8ff]" /> Cloud Synced
                </>
              ) : (
                <>
                  <ShieldCheck size={11} className="text-[#5cb8ff]" /> Student Vault
                </>
              )}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#7891c0]">
            {notes.length} note{notes.length === 1 ? "" : "s"} across {subjectsInUse.length - 1} subject areas.
          </p>
        </div>

        <button
          className="btn-primary gap-2 shadow-lg shadow-cobalt-600/30"
          onClick={() => setCreating(true)}
          aria-label="Create new note"
        >
          <BookPlus size={17} />
          <span>+ New Note</span>
        </button>
      </div>

      {/* Filter, Search & Sort Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a72a0]" />
            <input
              className="input pl-10"
              placeholder="Search notes by title, concept, subject, or #tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search notes"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7891c0] hover:text-white"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-[#7891c0]">
              <ArrowUpDown size={13} /> Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="input w-auto py-1.5 text-xs font-medium"
              aria-label="Sort notes"
            >
              <option value="updated_desc">Recently Updated</option>
              <option value="updated_asc">Oldest First</option>
              <option value="title_asc">Title (A – Z)</option>
              <option value="title_desc">Title (Z – A)</option>
            </select>
          </div>
        </div>

        {/* Subject Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scroll-slim">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5a72a0]">Subject:</span>
          {subjectsInUse.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              className={`chip cursor-pointer whitespace-nowrap border transition-colors ${
                filterSubject === s
                  ? "border-cobalt-500 bg-cobalt-500/20 text-[#5cb8ff]"
                  : "border-[#1a3060]/60 bg-[#0C2042] text-[#7891c0] hover:bg-[#102A50]/60 hover:text-[#e0eaff]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Tags Filter Chips (if any exist) */}
        {tagsInUse.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-slim">
            <span className="flex items-center gap-1 text-xs text-[#5a72a0]">
              <Tag size={12} /> Tags:
            </span>
            {tagsInUse.map((t) => (
              <button
                key={t}
                onClick={() => setFilterTag(t)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  filterTag === t
                    ? "bg-cobalt-600 text-white"
                    : "bg-[#081630] text-[#7891c0] hover:text-[#e0eaff]"
                }`}
              >
                {t === "All" ? "All Tags" : `#${t}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Display */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center border-dashed border-[#1e3764] py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cobalt-950/60 text-cobalt-400 border border-cobalt-600/30">
            <BookOpen size={30} />
          </div>
          <h2 className="heading-serif mt-4 text-lg font-semibold text-[#e0eaff]">
            {notes.length === 0
              ? "Your Study Vault is Empty"
              : "No notes matched your search"}
          </h2>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[#7891c0]">
            {notes.length === 0
              ? "Create structured class notes with markdown styling, subjects, and tags to keep your study sessions organized."
              : "Try adjusting your search terms or clearing your subject filters."}
          </p>
          {notes.length === 0 ? (
            <button
              className="btn-primary mt-5 gap-2"
              onClick={() => setCreating(true)}
            >
              <BookPlus size={16} /> Create Your First Note
            </button>
          ) : (
            <button
              className="btn-ghost mt-4 text-xs text-[#5cb8ff]"
              onClick={() => {
                setQuery("");
                setFilterSubject("All");
                setFilterTag("All");
              }}
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => setViewing(n)}
              className="card group flex cursor-pointer flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-cobalt-500/50 hover:shadow-xl hover:shadow-cobalt-950/30"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`chip text-[11px] ${subjectColor(n.subject)}`}>
                      {n.subject}
                    </span>
                  </div>
                  <h3 className="line-clamp-1 heading-serif text-base font-semibold text-[#e0eaff] group-hover:text-[#5cb8ff] transition-colors">
                    {n.title}
                  </h3>
                </div>

                {/* Quick Action buttons */}
                <div
                  className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setEditing(n)}
                    className="rounded-md p-1.5 text-[#7891c0] transition-colors hover:bg-[#102A50] hover:text-[#5cb8ff]"
                    title="Edit note"
                    aria-label="Edit note"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(n)}
                    className="rounded-md p-1.5 text-[#7891c0] transition-colors hover:bg-rose-500/20 hover:text-rose-400"
                    title="Delete note"
                    aria-label="Delete note"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Content Preview */}
              <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-xs leading-relaxed text-[#7891c0]">
                {n.content}
              </p>

              {/* Tags */}
              {n.tags && n.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {n.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-[#081630] px-1.5 py-0.5 text-[10px] font-medium text-[#7891c0]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Card Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-[#1a3060]/40 pt-3 text-[11px] text-[#5a72a0]">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(n.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="flex items-center gap-1 text-[#5cb8ff] opacity-0 transition-opacity group-hover:opacity-100">
                  <Eye size={12} /> Read full note
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Editor Modal (Create or Edit) */}
      {(creating || editing) && (
        <NoteEditor
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={async (payload) => {
            if (editing) {
              await updateNote(editing.id, payload);
            } else {
              await addNote(payload);
            }
            handleSaved();
          }}
        />
      )}

      {/* Note Reader Modal */}
      {viewing && (
        <NoteReader
          note={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            const noteToEdit = viewing;
            setViewing(null);
            setEditing(noteToEdit);
          }}
          onDelete={() => {
            const noteToDelete = viewing;
            setViewing(null);
            setConfirmDelete(noteToDelete);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete study note?"
        message={`Are you sure you want to permanently delete "${confirmDelete?.title}"? This action cannot be undone.`}
        onConfirm={async () => {
          if (confirmDelete) {
            await deleteNote(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ==============================================================
// NOTE EDITOR COMPONENT
// ==============================================================

interface NoteEditorProps {
  initial: Note | null;
  onClose: () => void;
  onSave: (n: { title: string; subject: string; content: string; tags: string[] }) => Promise<void>;
}

function NoteEditor({ initial, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState("");
  const [isCustomSubject, setIsCustomSubject] = useState(
    initial ? !SUBJECTS.includes(initial.subject) : false
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Formatting tool helper: wraps selection or inserts markdown token
  const insertFormatting = (prefix: string, suffix = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;
    const selected = currentVal.substring(start, end);
    const replacement = prefix + (selected || "sample text") + suffix;
    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setContent(nextVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 11));
    }, 0);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, "");
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    setError("");
    if (!title.trim()) {
      setError("Please enter a note title.");
      return;
    }
    const finalSubject = isCustomSubject ? customSubject.trim() : subject;
    if (!finalSubject) {
      setError("Please select or enter a subject.");
      return;
    }
    if (!content.trim()) {
      setError("Please enter your study note content.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        subject: finalSubject,
        content: content.trim(),
        tags,
      });
    } catch {
      setError("Could not save note. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit Note" : "Create Study Note"}
    >
      <div className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="label" htmlFor="note-title">
            Note Title <span className="text-rose-400">*</span>
          </label>
          <input
            id="note-title"
            className="input text-base font-medium"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fundamental Theorem of Calculus & Proofs"
            autoFocus
          />
        </div>

        {/* Subject Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="note-subject">
              Subject Area <span className="text-rose-400">*</span>
            </label>
            <select
              id="note-subject"
              className="input"
              value={isCustomSubject ? "__custom__" : subject}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomSubject(true);
                } else {
                  setIsCustomSubject(false);
                  setSubject(e.target.value);
                }
              }}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="__custom__">+ Enter Custom Subject…</option>
            </select>
          </div>

          {isCustomSubject && (
            <div>
              <label className="label" htmlFor="note-custom-subject">
                Custom Subject Name
              </label>
              <input
                id="note-custom-subject"
                className="input"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. Organic Chemistry II"
              />
            </div>
          )}
        </div>

        {/* Tags input */}
        <div>
          <label className="label" htmlFor="note-tags">
            Tags (Optional)
          </label>
          <div className="flex gap-2">
            <input
              id="note-tags"
              className="input flex-1 text-xs"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tag and press Enter (e.g. #midterm, #formulas)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn-ghost shrink-0 border border-[#274074] text-xs text-[#5cb8ff]"
            >
              Add Tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-[#081630] border border-cobalt-500/30 px-2 py-0.5 text-xs text-[#5cb8ff]"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-[#7891c0] hover:text-rose-400"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content area with Formatting Toolbar */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0" htmlFor="note-content">
              Note Content <span className="text-rose-400">*</span>
            </label>

            {/* Edit / Preview Tabs */}
            <div className="flex rounded-lg border border-[#1a3060] bg-[#081630] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  activeTab === "edit"
                    ? "bg-cobalt-600 text-white"
                    : "text-[#7891c0] hover:text-white"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-cobalt-600 text-white"
                    : "text-[#7891c0] hover:text-white"
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Quick Formatting Toolbar (active in Edit tab) */}
          {activeTab === "edit" && (
            <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-[#1a3060]/70 bg-[#081630]/90 p-1">
              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                className="rounded p-1.5 text-[#7891c0] hover:bg-[#102A50] hover:text-white"
                title="Bold (**text**)"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                className="rounded p-1.5 text-[#7891c0] hover:bg-[#102A50] hover:text-white"
                title="Italic (*text*)"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("### ")}
                className="rounded p-1.5 text-[#7891c0] hover:bg-[#102A50] hover:text-white"
                title="Heading (### Heading)"
              >
                <Heading2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("- ")}
                className="rounded p-1.5 text-[#7891c0] hover:bg-[#102A50] hover:text-white"
                title="Bullet item (- Item)"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("```\n", "\n```")}
                className="rounded p-1.5 text-[#7891c0] hover:bg-[#102A50] hover:text-white"
                title="Code block (```code```)"
              >
                <Code size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("> ")}
                className="rounded p-1.5 text-[#7891c0] hover:bg-[#102A50] hover:text-white"
                title="Quote (> Quote)"
              >
                <Quote size={14} />
              </button>
            </div>
          )}

          {activeTab === "edit" ? (
            <textarea
              ref={textareaRef}
              id="note-content"
              className="input min-h-[220px] resize-y font-mono text-xs leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write detailed study notes, proofs, formulas, or lecture summaries here…"
            />
          ) : (
            <div className="card min-h-[220px] max-h-[360px] overflow-y-auto p-4 bg-[#081630]">
              <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[#c4dcff] whitespace-pre-wrap">
                {content || <span className="text-[#5a72a0] italic">Nothing to preview yet.</span>}
              </div>
            </div>
          )}

          <div className="mt-1.5 flex justify-between text-[11px] text-[#5a72a0]">
            <span>Markdown formatting supported</span>
            <span>
              {content.length} characters · {content.trim() ? content.trim().split(/\s+/).length : 0} words
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#1a3060]/50 pt-4">
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving Note…
              </>
            ) : (
              <>
                <Check size={16} /> Save Note
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ==============================================================
// NOTE READER MODAL (Comfortable Long-Form Study View)
// ==============================================================

interface NoteReaderProps {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function NoteReader({ note, onClose, onEdit, onDelete }: NoteReaderProps) {
  return (
    <Modal open onClose={onClose} title={note.title}>
      <div className="space-y-4">
        {/* Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1a3060]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className={`chip ${subjectColor(note.subject)}`}>{note.subject}</span>
            <span className="text-xs text-[#5a72a0]">
              Updated {new Date(note.updatedAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onEdit}
              className="btn-ghost text-xs gap-1.5 text-[#5cb8ff]"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="btn-ghost text-xs gap-1.5 text-rose-400 hover:text-rose-300"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-[#081630] border border-[#1a3060] px-2 py-0.5 text-xs text-[#7891c0]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Full Note Content with comfortable typography */}
        <div className="card max-h-[500px] overflow-y-auto p-5 bg-[#081630]/70 border-[#1a3060]/60 scroll-slim">
          <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#d4e4ff]">
            {note.content}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button className="btn-primary text-xs" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
