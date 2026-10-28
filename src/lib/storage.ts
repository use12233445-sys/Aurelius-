import type { Assignment, Note, StudySession, ClassmateMessage, ClassmateChannel } from "./types";

const NOTES_LEGACY_KEY = "campus_compass_notes";
const NOTES_PREFIX = "aurelius_notes_";
const ASSIGN_KEY = "campus_compass_assignments";
const SESSIONS_KEY = "campus_compass_sessions";
const CHANNELS_KEY = "aurelius_chat_channels";
const MESSAGES_PREFIX = "aurelius_chat_messages_";

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

export function getNotesKey(userId?: string): string {
  if (!userId || userId === "guest") {
    return `${NOTES_PREFIX}guest`;
  }
  return `${NOTES_PREFIX}${userId}`;
}

export const loadNotes = (userId?: string): Note[] => {
  const key = getNotesKey(userId);
  const userNotes = read<Note[]>(key, []);
  if (userNotes.length > 0) {
    return userNotes;
  }
  // Check if legacy un-scoped notes exist from previous version
  const legacyNotes = read<Note[]>(NOTES_LEGACY_KEY, []);
  if (legacyNotes.length > 0) {
    // Migrate legacy notes to current user vault so data is preserved
    write(key, legacyNotes);
    return legacyNotes;
  }
  return [];
};

export const saveNotes = (notes: Note[], userId?: string): void => {
  const key = getNotesKey(userId);
  write(key, notes);
  // Also keep legacy key updated if guest for backwards compatibility
  if (!userId || userId === "guest") {
    write(NOTES_LEGACY_KEY, notes);
  }
};

export const loadAssignments = (): Assignment[] =>
  read<Assignment[]>(ASSIGN_KEY, []);
export const saveAssignments = (a: Assignment[]): void => write(ASSIGN_KEY, a);

export const loadSessions = (): StudySession[] =>
  read<StudySession[]>(SESSIONS_KEY, []);
export const saveSessions = (s: StudySession[]): void =>
  write(SESSIONS_KEY, s);

export const loadClassmateChannels = (): ClassmateChannel[] =>
  read<ClassmateChannel[]>(CHANNELS_KEY, []);
export const saveClassmateChannels = (channels: ClassmateChannel[]): void =>
  write(CHANNELS_KEY, channels);

export const loadClassmateMessages = (channelId: string): ClassmateMessage[] =>
  read<ClassmateMessage[]>(`${MESSAGES_PREFIX}${channelId}`, []);
export const saveClassmateMessages = (channelId: string, messages: ClassmateMessage[]): void =>
  write(`${MESSAGES_PREFIX}${channelId}`, messages);
