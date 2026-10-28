import { useEffect, useState, useCallback, useRef } from "react";
import type { ClassmateChannel, ClassmateMessage } from "./types";
import {
  loadClassmateChannels,
  saveClassmateChannels,
  loadClassmateMessages,
  saveClassmateMessages,
} from "./storage";
import { supabase, supabaseConfigured } from "./supabase";

export const DEFAULT_CHANNELS: ClassmateChannel[] = [
  {
    id: "general",
    name: "General Campus Lounge",
    subject: "All Subjects",
    description: "Campus-wide student discussions, peer check-ins, and study questions.",
    createdAt: 1730000000000,
  },
  {
    id: "calculus",
    name: "Calculus & Mathematics",
    subject: "Mathematics",
    description: "Derivatives, integrals, proofs, and problem set walkthroughs.",
    createdAt: 1730000000001,
  },
  {
    id: "cs-algorithms",
    name: "Computer Science & Code",
    subject: "Computer Science",
    description: "Algorithms, TypeScript, React, debugging, and project collaboration.",
    createdAt: 1730000000002,
  },
  {
    id: "physics",
    name: "Physics & Engineering",
    subject: "Physics",
    description: "Mechanics, circuits, lab notes, and experimental problem sets.",
    createdAt: 1730000000003,
  },
  {
    id: "study-group",
    name: "Exam Cramming & Flashcards",
    subject: "Study Skills",
    description: "Active recall sessions, study guides, and upcoming midterm prep.",
    createdAt: 1730000000004,
  },
];

const INITIAL_DEMO_MESSAGES: Record<string, ClassmateMessage[]> = {
  general: [
    {
      id: "msg_init_1",
      channelId: "general",
      senderId: "marcus_a",
      senderName: "Marcus A.",
      senderEmail: "marcus.a@aurelius.edu",
      content: "Welcome to Aurelius Classmates Chat! Feel free to ask questions or start a study group here.",
      createdAt: Date.now() - 3600000 * 5,
    },
    {
      id: "msg_init_2",
      channelId: "general",
      senderId: "elena_v",
      senderName: "Elena Rostova",
      senderEmail: "elena.r@aurelius.edu",
      content: "Hey everyone! Anyone working on the problem sets due this Friday?",
      createdAt: Date.now() - 3600000 * 2,
    },
  ],
  calculus: [
    {
      id: "msg_init_3",
      channelId: "calculus",
      senderId: "devon_k",
      senderName: "Devon Kim",
      senderEmail: "devon.k@aurelius.edu",
      content: "Tip: For Problem 4 on integration by parts, let u = ln(x) and dv = x^2 dx.",
      createdAt: Date.now() - 3600000 * 3,
    },
  ],
};

export type RealtimeStatus = "connected" | "connecting" | "offline";

export function useClassmatesChat(currentUser: { id: string; email: string | null; name: string }) {
  const [channels, setChannels] = useState<ClassmateChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("general");
  const [messages, setMessages] = useState<ClassmateMessage[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const lastSendTs = useRef<number>(0);

  // Initialize channels
  useEffect(() => {
    const saved = loadClassmateChannels();
    if (saved.length === 0) {
      saveClassmateChannels(DEFAULT_CHANNELS);
      setChannels(DEFAULT_CHANNELS);
    } else {
      setChannels(saved);
    }
  }, []);

  // Load messages whenever activeChannelId changes
  useEffect(() => {
    const loaded = loadClassmateMessages(activeChannelId);
    if (loaded.length === 0 && INITIAL_DEMO_MESSAGES[activeChannelId]) {
      const initMsgs = INITIAL_DEMO_MESSAGES[activeChannelId];
      saveClassmateMessages(activeChannelId, initMsgs);
      setMessages(initMsgs);
    } else {
      setMessages(loaded);
    }
  }, [activeChannelId]);

  // Connect to Supabase Realtime broadcast channel
  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setRealtimeStatus("offline");
      return;
    }

    setRealtimeStatus("connecting");
    const channel = supabase.channel("aurelius_classmates_lounge", {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "new_classmate_message" }, ({ payload }) => {
        if (!payload || !payload.id || !payload.channelId || !payload.content) return;
        const incoming = payload as ClassmateMessage;

        // Persist message to channel's local store
        const currentMsgs = loadClassmateMessages(incoming.channelId);
        if (!currentMsgs.some((m) => m.id === incoming.id)) {
          const updated = [...currentMsgs, incoming];
          saveClassmateMessages(incoming.channelId, updated);

          // If this message belongs to the currently active channel, update view
          if (incoming.channelId === activeChannelId) {
            setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          }
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeStatus("offline");
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [activeChannelId]);

  const sendMessage = useCallback(
    async (rawContent: string): Promise<boolean> => {
      const content = rawContent.trim();
      setSendError("");

      if (!content) {
        setSendError("Message cannot be empty.");
        return false;
      }

      if (content.length > 2000) {
        setSendError("Message is too long (maximum 2,000 characters).");
        return false;
      }

      // Rate limit: 400ms cooldown
      const now = Date.now();
      if (now - lastSendTs.current < 400) {
        setSendError("Please wait a moment before sending another message.");
        return false;
      }
      lastSendTs.current = now;

      setIsSending(true);

      const msgId = "msg_" + Math.random().toString(36).slice(2, 9) + "_" + now.toString(36);
      const newMsg: ClassmateMessage = {
        id: msgId,
        channelId: activeChannelId,
        senderId: currentUser.id,
        senderName: currentUser.name || "Student",
        senderEmail: currentUser.email || "guest@aurelius.edu",
        content,
        createdAt: now,
      };

      // 1. Optimistic local update & persist
      const currentList = loadClassmateMessages(activeChannelId);
      const updatedList = [...currentList, newMsg];
      saveClassmateMessages(activeChannelId, updatedList);
      setMessages(updatedList);

      // 2. Broadcast via Supabase Realtime to all other online classmates
      if (supabaseConfigured && supabase) {
        try {
          const broadcastChannel = supabase.channel("aurelius_classmates_lounge");
          await broadcastChannel.send({
            type: "broadcast",
            event: "new_classmate_message",
            payload: newMsg,
          });

          // Also attempt cloud table insert if database table is available
          Promise.resolve(
            supabase
              .from("conversation_messages")
              .insert({
                id: newMsg.id,
                conversation_id: newMsg.channelId,
                sender_id: newMsg.senderId,
                sender_name: newMsg.senderName,
                sender_email: newMsg.senderEmail,
                content: newMsg.content,
                created_at: new Date(newMsg.createdAt).toISOString(),
              })
          ).catch(() => {});
        } catch {
          // Non-fatal: local message is already stored and viewable
        }
      }

      setIsSending(false);
      return true;
    },
    [activeChannelId, currentUser],
  );

  const createChannel = useCallback(
    (name: string, subject: string, description: string): ClassmateChannel => {
      const newChan: ClassmateChannel = {
        id: "chan_" + Math.random().toString(36).slice(2, 8),
        name: name.trim(),
        subject: subject.trim() || "General",
        description: description.trim(),
        createdAt: Date.now(),
        createdBy: currentUser.id,
      };

      const updated = [...channels, newChan];
      saveClassmateChannels(updated);
      setChannels(updated);
      setActiveChannelId(newChan.id);
      return newChan;
    },
    [channels, currentUser.id],
  );

  return {
    channels,
    activeChannel: channels.find((c) => c.id === activeChannelId) ?? channels[0] ?? DEFAULT_CHANNELS[0],
    activeChannelId,
    setActiveChannelId,
    messages,
    sendMessage,
    createChannel,
    realtimeStatus,
    isSending,
    sendError,
  };
}
