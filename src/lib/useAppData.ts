import { useCallback, useEffect, useState } from "react";
import type { Assignment, Note, StudySession } from "./types";
import {
  loadAssignments,
  loadNotes,
  loadSessions,
  saveAssignments,
  saveNotes,
  saveSessions,
} from "./storage";
import {
  makeSampleAssignments,
  makeSampleNotes,
  makeSampleSessions,
} from "./sampleData";
import { supabase, supabaseConfigured } from "./supabase";

function uid(): string {
  return "note_" + Math.random().toString(36).slice(2, 9) + "_" + Date.now().toString(36);
}

const SEEDED = "campus_compass_seeded_v1";

export interface AppData {
  notes: Note[];
  assignments: Assignment[];
  sessions: StudySession[];
  notesStorageMode: "cloud" | "local";
  notesLoading: boolean;
  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addAssignment: (
    a: Omit<Assignment, "id" | "createdAt" | "completed">,
  ) => void;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  toggleAssignment: (id: string) => void;
  addSession: (s: Omit<StudySession, "id" | "date">) => void;
  deleteSession: (id: string) => void;
}

function seedIfEmpty(userId?: string): void {
  if (localStorage.getItem(SEEDED)) return;
  const initial = makeSampleNotes();
  saveNotes(initial, userId);
  saveAssignments(makeSampleAssignments());
  saveSessions(makeSampleSessions());
  localStorage.setItem(SEEDED, "1");
}

export function useAppData(userId?: string): AppData {
  const [notes, setNotes] = useState<Note[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [notesStorageMode, setNotesStorageMode] = useState<"cloud" | "local">("local");
  const [notesLoading, setNotesLoading] = useState(false);

  // Initial load
  useEffect(() => {
    seedIfEmpty(userId);
    const localNotes = loadNotes(userId);
    setNotes(localNotes);
    setAssignments(loadAssignments());
    setSessions(loadSessions());

    // If Supabase is configured and we have an authenticated user, check if cloud notes table exists
    if (supabaseConfigured && supabase && userId && userId !== "guest") {
      setNotesLoading(true);
      Promise.resolve(
        supabase
          .from("notes")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
      )
        .then(({ data, error }: { data: Array<Record<string, unknown>> | null; error: unknown }) => {
          setNotesLoading(false);
          if (!error && data) {
            setNotesStorageMode("cloud");
            // Map db schema to Note format
            const cloudNotes: Note[] = data.map((row: Record<string, unknown>) => ({
              id: String(row.id),
              title: String(row.title),
              subject: String(row.subject),
              content: String(row.content),
              tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
              createdAt: new Date(String(row.created_at)).getTime(),
              updatedAt: new Date(String(row.updated_at)).getTime(),
              userId: String(row.user_id),
            }));
            if (cloudNotes.length > 0) {
              setNotes(cloudNotes);
              saveNotes(cloudNotes, userId);
            }
          } else {
            // Table doesn't exist or offline; keep local storage
            setNotesStorageMode("local");
          }
        })
        .catch(() => {
          setNotesLoading(false);
          setNotesStorageMode("local");
        });
    } else {
      setNotesStorageMode("local");
    }
  }, [userId]);

  const persistNotes = useCallback((next: Note[]) => {
    setNotes(next);
    saveNotes(next, userId);
  }, [userId]);

  const persistAssignments = useCallback((next: Assignment[]) => {
    setAssignments(next);
    saveAssignments(next);
  }, []);

  const persistSessions = useCallback((next: StudySession[]) => {
    setSessions(next);
    saveSessions(next);
  }, []);

  const addNote: AppData["addNote"] = useCallback(
    async (n) => {
      const now = Date.now();
      const newNote: Note = {
        ...n,
        id: uid(),
        tags: n.tags ?? [],
        createdAt: now,
        updatedAt: now,
        userId: userId ?? "guest",
      };

      const current = loadNotes(userId);
      const nextNotes = [newNote, ...current];
      persistNotes(nextNotes);

      // Attempt cloud sync if authenticated and Supabase is configured
      if (supabaseConfigured && supabase && userId && userId !== "guest") {
        try {
          const { error } = await supabase.from("notes").insert({
            id: newNote.id,
            user_id: userId,
            title: newNote.title,
            subject: newNote.subject,
            content: newNote.content,
            tags: newNote.tags,
            created_at: new Date(newNote.createdAt).toISOString(),
            updated_at: new Date(newNote.updatedAt).toISOString(),
          });
          if (!error) {
            setNotesStorageMode("cloud");
          }
        } catch {
          // Keep local
        }
      }

      return newNote;
    },
    [persistNotes, userId],
  );

  const updateNote: AppData["updateNote"] = useCallback(
    async (id, patch) => {
      const current = loadNotes(userId);
      const now = Date.now();
      const nextNotes = current.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: now } : n,
      );
      persistNotes(nextNotes);

      if (supabaseConfigured && supabase && userId && userId !== "guest") {
        try {
          const updated = nextNotes.find((n) => n.id === id);
          if (updated) {
            await supabase
              .from("notes")
              .update({
                title: updated.title,
                subject: updated.subject,
                content: updated.content,
                tags: updated.tags ?? [],
                updated_at: new Date(now).toISOString(),
              })
              .eq("id", id)
              .eq("user_id", userId);
          }
        } catch {
          // Keep local
        }
      }
    },
    [persistNotes, userId],
  );

  const deleteNote: AppData["deleteNote"] = useCallback(
    async (id) => {
      const current = loadNotes(userId);
      const nextNotes = current.filter((n) => n.id !== id);
      persistNotes(nextNotes);

      if (supabaseConfigured && supabase && userId && userId !== "guest") {
        try {
          await supabase.from("notes").delete().eq("id", id).eq("user_id", userId);
        } catch {
          // Keep local
        }
      }
    },
    [persistNotes, userId],
  );

  const addAssignment: AppData["addAssignment"] = useCallback(
    (a) => {
      persistAssignments([
        { ...a, id: uid(), createdAt: Date.now(), completed: false },
        ...loadAssignments(),
      ]);
    },
    [persistAssignments],
  );

  const updateAssignment: AppData["updateAssignment"] = useCallback(
    (id, patch) => {
      persistAssignments(
        loadAssignments().map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
    },
    [persistAssignments],
  );

  const deleteAssignment: AppData["deleteAssignment"] = useCallback(
    (id) => {
      persistAssignments(loadAssignments().filter((a) => a.id !== id));
    },
    [persistAssignments],
  );

  const toggleAssignment: AppData["toggleAssignment"] = useCallback(
    (id) => {
      persistAssignments(
        loadAssignments().map((a) =>
          a.id === id ? { ...a, completed: !a.completed } : a,
        ),
      );
    },
    [persistAssignments],
  );

  const addSession: AppData["addSession"] = useCallback(
    (s) => {
      persistSessions([
        ...loadSessions(),
        { ...s, id: uid(), date: Date.now() },
      ]);
    },
    [persistSessions],
  );

  const deleteSession: AppData["deleteSession"] = useCallback(
    (id) => {
      persistSessions(loadSessions().filter((s) => s.id !== id));
    },
    [persistSessions],
  );

  return {
    notes,
    assignments,
    sessions,
    notesStorageMode,
    notesLoading,
    addNote,
    updateNote,
    deleteNote,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    toggleAssignment,
    addSession,
    deleteSession,
  };
}
