import { useCallback, useEffect, useState, useRef } from "react";
import {
  ExternalLink, Plus, Share2, Trash2, AlertCircle, User,
  Send, Hash, Users, MessageSquare, Radio, Shield, Sparkles, Check
} from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { SharedResource } from "@/lib/types";
import { SUBJECTS } from "@/lib/sampleData";
import { subjectColor } from "@/components/badges";
import { Modal } from "@/components/Modal";
import { useClassmatesChat } from "@/lib/chatService";

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

function fmtMessageTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-cobalt-600 text-white",
    "bg-indigo-600 text-white",
    "bg-blue-600 text-white",
    "bg-sky-600 text-white",
    "bg-cyan-700 text-white",
    "bg-violet-600 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

interface ShareViewProps {
  currentUser?: { id: string; email: string | null; name: string };
}

export function ShareView({ currentUser }: ShareViewProps) {
  const user = currentUser ?? {
    id: "student_guest",
    email: "guest@aurelius.edu",
    name: "Guest Student",
  };

  const [activeTab, setActiveTab] = useState<"chat" | "resources">("chat");

  return (
    <div className="space-y-6">
      {/* Header and Tab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a3060]/50 pb-5">
        <div>
          <h1 className="heading-serif text-3xl font-semibold text-[#e0eaff]">Classmates</h1>
          <p className="mt-1 text-sm text-[#7891c0]">
            Collaborate in realtime study channels and share academic resources with peers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl border border-[#1e3764] bg-[#081630] p-1">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              activeTab === "chat"
                ? "bg-cobalt-600 text-white shadow-md shadow-cobalt-600/30"
                : "text-[#7891c0] hover:text-[#e0eaff]"
            }`}
          >
            <MessageSquare size={14} /> Classmate Chat
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              activeTab === "resources"
                ? "bg-cobalt-600 text-white shadow-md shadow-cobalt-600/30"
                : "text-[#7891c0] hover:text-[#e0eaff]"
            }`}
          >
            <Share2 size={14} /> Resource Library
          </button>
        </div>
      </div>

      {activeTab === "chat" ? (
        <ClassmatesChatSection currentUser={user} />
      ) : (
        <ResourceLibrarySection />
      )}
    </div>
  );
}

// ==============================================================
// 1. CLASSMATES REALTIME CHAT SECTION
// ==============================================================

function ClassmatesChatSection({
  currentUser,
}: {
  currentUser: { id: string; email: string | null; name: string };
}) {
  const {
    channels,
    activeChannel,
    activeChannelId,
    setActiveChannelId,
    messages,
    sendMessage,
    createChannel,
    realtimeStatus,
    isSending,
    sendError,
  } = useClassmatesChat(currentUser);

  const [inputContent, setInputContent] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputContent.trim() || isSending) return;
    const ok = await sendMessage(inputContent);
    if (ok) {
      setInputContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card overflow-hidden border-[#1e3764]/70 bg-[#081630]">
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left: Channels List Panel */}
        <div className="md:col-span-4 border-r border-[#1a3060]/60 bg-[#061128]/80 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a3060]/50">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#5cb8ff]" />
              <span className="heading-serif text-sm font-semibold text-[#e0eaff]">Study Channels</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg border border-[#1a3060] bg-[#0C2042] p-1.5 text-xs text-[#7891c0] hover:border-cobalt-500/50 hover:text-[#5cb8ff] transition-colors"
              title="Create new channel"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Channels scroll list */}
          <div className="flex-1 space-y-1.5 overflow-y-auto pt-3 scroll-slim">
            {channels.map((chan) => {
              const isActive = chan.id === activeChannelId;
              return (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannelId(chan.id)}
                  className={`flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-all ${
                    isActive
                      ? "bg-cobalt-600/20 border border-cobalt-500/40 shadow-md shadow-cobalt-950/40"
                      : "hover:bg-[#102A50]/50 border border-transparent"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? "bg-cobalt-600 text-white" : "bg-[#0C2042] text-[#7891c0]"
                    }`}
                  >
                    <Hash size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`truncate text-xs font-semibold ${isActive ? "text-[#e0eaff]" : "text-[#7891c0]"}`}>
                        {chan.name}
                      </p>
                    </div>
                    <p className="truncate text-[11px] text-[#5a72a0] mt-0.5">{chan.subject}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* User ID / Realtime badge */}
          <div className="mt-3 rounded-xl border border-[#1a3060]/50 bg-[#0C2042]/70 p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-[#5a72a0]">
                <Radio
                  size={12}
                  className={
                    realtimeStatus === "connected"
                      ? "text-emerald-400 animate-pulse"
                      : realtimeStatus === "connecting"
                      ? "text-amber-400"
                      : "text-slate-500"
                  }
                />
                {realtimeStatus === "connected" ? "Realtime Live" : realtimeStatus === "connecting" ? "Connecting…" : "Offline"}
              </span>
              <span className="text-[10px] text-[#7891c0]">WebSockets</span>
            </div>
          </div>
        </div>

        {/* Right: Main Chat Area */}
        <div className="md:col-span-8 flex flex-col bg-[#07152F]/70">
          {/* Channel Top Header */}
          <div className="flex items-center justify-between border-b border-[#1a3060]/60 bg-[#0C2042]/40 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt-600/20 text-[#5cb8ff] border border-cobalt-500/30">
                <Hash size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="heading-serif text-sm font-semibold text-[#e0eaff]">
                    {activeChannel.name}
                  </h2>
                  <span className={`chip text-[10px] ${subjectColor(activeChannel.subject)}`}>
                    {activeChannel.subject}
                  </span>
                </div>
                <p className="text-[11px] text-[#5a72a0] truncate max-w-md">
                  {activeChannel.description || "Study discussion channel"}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-cobalt-500/30 bg-cobalt-500/10 px-2.5 py-1 text-[11px] text-[#5cb8ff]">
              <Shield size={11} /> Authenticated Channel
            </div>
          </div>

          {/* Message History Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[420px] scroll-slim">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cobalt-950 text-[#5cb8ff] border border-cobalt-600/30">
                  <Sparkles size={22} />
                </div>
                <h3 className="heading-serif mt-3 text-sm font-semibold text-[#e0eaff]">
                  Welcome to #{activeChannel.name}
                </h3>
                <p className="mt-1 text-xs text-[#7891c0] max-w-xs">
                  This is the start of this channel. Say hello to your fellow classmates!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id || msg.senderEmail === currentUser.email;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(
                        msg.senderName
                      )}`}
                    >
                      {getInitials(msg.senderName)}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="text-xs font-semibold text-[#e0eaff]">
                          {msg.senderName} {isMe && <span className="text-[10px] text-[#5cb8ff] font-normal">(You)</span>}
                        </span>
                        <span className="text-[10px] text-[#5a72a0]">{fmtMessageTime(msg.createdAt)}</span>
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isMe
                            ? "bg-cobalt-600 text-white rounded-tr-none shadow-md shadow-cobalt-600/20"
                            : "bg-[#0C2042] text-[#d4e4ff] border border-[#1a3060]/70 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Footer */}
          <div className="border-t border-[#1a3060]/60 bg-[#061128]/80 p-3 sm:p-4">
            {sendError && (
              <p className="mb-2 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle size={12} /> {sendError}
              </p>
            )}

            <div className="relative flex items-center gap-2">
              <textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${activeChannel.name}… (Enter to send, Shift+Enter for newline)`}
                rows={1}
                maxLength={2000}
                className="input min-h-[44px] max-h-[120px] resize-none py-2.5 pr-20 text-xs text-[#e0eaff] bg-[#0C2042]"
              />

              <div className="absolute right-2.5 flex items-center gap-2">
                <span className="text-[10px] text-[#5a72a0] hidden sm:inline">
                  {inputContent.length}/2000
                </span>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputContent.trim() || isSending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt-600 text-white hover:bg-cobalt-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cobalt-600/30"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(name, subject, desc) => {
            createChannel(name, subject, desc);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateChannelModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, subject: string, desc: string) => void;
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!name.trim()) {
      setErr("Please provide a channel title.");
      return;
    }
    onCreate(name.trim(), subject, desc.trim());
  };

  return (
    <Modal open onClose={onClose} title="Create Study Channel">
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="chan-name">
            Channel Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="chan-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bio 101 Midterm Prep"
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="chan-subject">
            Subject Area
          </label>
          <select
            id="chan-subject"
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="chan-desc">
            Description (Optional)
          </label>
          <textarea
            id="chan-desc"
            className="input min-h-[80px] resize-y"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What will classmates discuss in this study channel?"
          />
        </div>

        {err && <p className="text-xs text-rose-400">{err}</p>}

        <div className="flex justify-end gap-2 border-t border-[#1a3060]/50 pt-3">
          <button className="btn-ghost text-xs" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary text-xs gap-1.5" onClick={submit}>
            <Check size={14} /> Create Channel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ==============================================================
// 2. RESOURCE LIBRARY SECTION (Preserves Existing Shared Board)
// ==============================================================

function ResourceLibrarySection() {
  const [items, setItems] = useState<SharedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [filterSubject, setFilterSubject] = useState("All");

  const load = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setError(
        "Resource sharing requires a database connection. Local notes and classmates chat remain functional."
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("shared_resources")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      setError("Could not load shared resources: " + error.message);
      return;
    }
    setItems((data as SharedResource[]) ?? []);
    setError("");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("shared_resources").delete().eq("id", id);
    if (error) {
      setError("Could not delete: " + error.message);
      return;
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const subjectsInUse = ["All", ...SUBJECTS.filter((s) => items.some((i) => i.subject === s))];
  const filtered = filterSubject === "All" ? items : items.filter((i) => i.subject === filterSubject);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-serif text-lg font-semibold text-[#e0eaff]">Shared Academic Resources</h2>
          <p className="text-xs text-[#7891c0]">Public resources and study links uploaded by fellow students.</p>
        </div>
        <button
          className="btn-primary text-xs gap-1.5"
          onClick={() => setCreating(true)}
          disabled={!supabaseConfigured}
        >
          <Plus size={14} /> Share a resource
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-slim">
        {subjectsInUse.map((s) => (
          <button
            key={s}
            onClick={() => setFilterSubject(s)}
            className={`chip cursor-pointer whitespace-nowrap border ${
              filterSubject === s
                ? "border-cobalt-500 bg-cobalt-500/20 text-[#5cb8ff]"
                : "border-[#1a3060]/60 bg-[#0C2042] text-[#7891c0] hover:bg-[#102A50]/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card py-16 text-center text-sm text-[#5a72a0]">
          Loading shared resources…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center border-dashed">
          <Share2 size={34} className="text-[#274074]" />
          <p className="mt-3 text-xs text-[#7891c0]">No resources shared yet. Be the first to contribute a link.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="card group flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-semibold text-[#e0eaff]">{r.title}</h3>
                <span className={`chip shrink-0 ${subjectColor(r.subject)}`}>{r.subject}</span>
              </div>
              {r.description && (
                <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-[#7891c0]">
                  {r.description}
                </p>
              )}
              <a
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#5cb8ff] hover:text-[#7dd3ff]"
              >
                <ExternalLink size={13} /> Open link
              </a>
              <div className="mt-3 flex items-center justify-between border-t border-[#1a3060]/40 pt-3 text-[11px] text-[#5a72a0]">
                <span className="flex items-center gap-1.5">
                  <User size={12} /> {r.author} · {relTime(r.created_at)}
                </span>
                <button
                  onClick={() => remove(r.id)}
                  className="rounded p-1 text-[#274074] opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                  aria-label="Delete resource"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <ShareEditor
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ShareEditor({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
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
    const { error } = await supabase
      .from("shared_resources")
      .insert({
        title: title.trim(),
        subject,
        link: url,
        description: description.trim(),
        author: author.trim(),
      });
    setSaving(false);
    if (error) return setErr("Could not save: " + error.message);
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Share an Academic Resource">
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="r-title">
            Title
          </label>
          <input
            id="r-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Khan Academy: Linear Algebra"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="r-subject">
              Subject
            </label>
            <select
              id="r-subject"
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="r-author">
              Your name
            </label>
            <input
              id="r-author"
              className="input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Alex"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="r-link">
            Link
          </label>
          <input
            id="r-link"
            className="input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="label" htmlFor="r-desc">
            Description (optional)
          </label>
          <textarea
            id="r-desc"
            className="input min-h-[90px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's helpful about this resource?"
          />
        </div>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Sharing…" : "Share"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
