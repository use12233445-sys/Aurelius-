export type Priority = "low" | "medium" | "high";

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO date (yyyy-mm-dd)
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

export interface StudySession {
  id: string;
  subject: string;
  durationSec: number; // seconds actually focused in this session
  date: number; // epoch ms when session ended
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface SharedResource {
  id: string;
  title: string;
  subject: string;
  link: string;
  description: string;
  author: string;
  created_at: string; // ISO timestamp from DB
}

export interface ClassmateMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: number;
}

export interface ClassmateChannel {
  id: string;
  name: string;
  subject: string;
  description: string;
  createdAt: number;
  createdBy?: string;
}
