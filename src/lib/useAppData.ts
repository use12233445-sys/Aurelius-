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

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SEEDED = "campus_compass_seeded_v1";

export interface AppData {
  notes: Note[];
  assignments: Assignment[];
  sessions: StudySession[];
  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addAssignment: (
    a: Omit<Assignment, "id" | "createdAt" | "completed">,
  ) => void;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  toggleAssignment: (id: string) => void;
  addSession: (s: Omit<StudySession, "id" | "date">) => void;
  deleteSession: (id: string) => void;
}

function seedIfEmpty(): void {
  if (localStorage.getItem(SEEDED)) return;
  saveNotes(makeSampleNotes());
  saveAssignments(makeSampleAssignments());
  saveSessions(makeSampleSessions());
  localStorage.setItem(SEEDED, "1");
}

export function useAppData(): AppData {
  const [notes, setNotes] = useState<Note[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    seedIfEmpty();
    setNotes(loadNotes());
    setAssignments(loadAssignments());
    setSessions(loadSessions());
  }, []);

  const persistNotes = useCallback((next: Note[]) => {
    setNotes(next);
    saveNotes(next);
  }, []);
  const persistAssignments = useCallback((next: Assignment[]) => {
    setAssignments(next);
    saveAssignments(next);
  }, []);
  const persistSessions = useCallback((next: StudySession[]) => {
    setSessions(next);
    saveSessions(next);
  }, []);

  const addNote: AppData["addNote"] = useCallback(
    (n) => {
      const now = Date.now();
      persistNotes([
        { ...n, id: uid(), createdAt: now, updatedAt: now },
        ...loadNotes(),
      ]);
    },
    [persistNotes],
  );

  const updateNote: AppData["updateNote"] = useCallback(
    (id, patch) => {
      persistNotes(
        loadNotes().map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
        ),
      );
    },
    [persistNotes],
  );

  const deleteNote: AppData["deleteNote"] = useCallback(
    (id) => {
      persistNotes(loadNotes().filter((n) => n.id !== id));
    },
    [persistNotes],
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
