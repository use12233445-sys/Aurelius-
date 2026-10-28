import type { ChatMessage } from "./types";

export interface AskResult {
  ok: boolean;
  reply?: string;
  networkError?: boolean;
  error?: string;
}

export async function askTutor(history: ChatMessage[]): Promise<AskResult> {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  if (!url || !key) {
    return {
      ok: false,
      networkError: true,
      error: "Supabase is not configured for this project.",
    };
  }
  const endpoint = `${url}/functions/v1/ai-tutor`;
  const recent = history.slice(-8).map((m) => ({ role: m.role, content: m.content }));
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ messages: recent }),
    });
    if (!res.ok) {
      return { ok: false, networkError: true, error: `Request failed (${res.status})` };
    }
    const data = await res.json();
    if (typeof data.reply !== "string") {
      return { ok: false, networkError: true, error: "Unexpected response from server." };
    }
    return { ok: true, reply: data.reply };
  } catch {
    return { ok: false, networkError: true, error: "Could not reach the AI service." };
  }
}
