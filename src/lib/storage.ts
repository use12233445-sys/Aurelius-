import type { Assignment, Note, StudySession } from "./types";

const NOTES_KEY = "campus_compass_notes";
const ASSIGN_KEY = "campus_compass_assignments";
const SESSIONS_KEY = "campus_compass_sessions";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable; non-fatal for MVP
  }
}

export const loadNotes = (): Note[] => read<Note[]>(NOTES_KEY, []);
export const saveNotes = (notes: Note[]): void => write(NOTES_KEY, notes);

export const loadAssignments = (): Assignment[] =>
  read<Assignment[]>(ASSIGN_KEY, []);
export const saveAssignments = (a: Assignment[]): void => write(ASSIGN_KEY, a);

export const loadSessions = (): StudySession[] =>
  read<StudySession[]>(SESSIONS_KEY, []);
export const saveSessions = (s: StudySession[]): void =>
  write(SESSIONS_KEY, s);
