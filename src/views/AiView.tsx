import { useEffect, useRef, useState } from "react";
import { MessagesSquare, Send, Sparkles, AlertCircle, ServerCrash } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { askTutor } from "@/lib/ai";

function uid(): string { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function AiView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setStatus("idle"); setErrorMsg("");
    const userMsg: ChatMessage = { id: uid(), role: "user", content, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true);
    const res = await askTutor(next);
    setLoading(false);
    if (res.ok && res.reply) {
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: res.reply!, ts: Date.now() }]);
    } else {
      setStatus("error"); setErrorMsg(res.error || "Something went wrong.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:h-[calc(100vh-7rem)]">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 heading-serif text-2xl font-semibold text-[#e0eaff]">
          <Sparkles size={22} className="text-[#5cb8ff]" /> AI Doubt Solver
        </h1>
        <p className="text-sm text-[#7891c0]">Ask a question — answers come from a real AI model through a secure server endpoint.</p>
      </div>

      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="scroll-slim flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cobalt-500/15 text-[#5cb8ff]">
                <MessagesSquare size={26} />
              </div>
              <p className="mt-4 text-sm font-medium text-[#e0eaff]">What are you stuck on?</p>
              <p className="mt-1 max-w-sm text-xs text-[#5a72a0]">Try: "Explain the chain rule with an example" or "What's the difference between mitosis and meiosis?"</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Explain Big-O notation", "Summarize photosynthesis", "How do I solve quadratic equations?"].map((s) => (
                  <button key={s} onClick={() => send(s)} className="chip border border-[#1a3060]/60 bg-[#102A50]/50 text-[#7891c0] hover:bg-[#1a3060]/50 hover:text-[#e0eaff] cursor-pointer">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  m.role === "user" ? "bg-cobalt-600 text-white" : "bg-[#102A50] text-[#e0eaff]"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-[#102A50] px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5cb8ff] [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5cb8ff] [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5cb8ff]" />
                </div>
              </div>
            )}
          </div>

          {status === "error" && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <div className="flex items-start gap-2.5">
                <ServerCrash size={18} className="mt-0.5 shrink-0 text-rose-400" />
                <div className="text-sm text-rose-300">
                  <p className="font-semibold">Couldn't reach the AI service</p>
                  <p className="mt-1">{errorMsg} Please try again in a moment.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form className="flex items-center gap-2 border-t border-[#1a3060]/50 p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input className="input flex-1" placeholder={loading ? "Thinking…" : "Ask your question…"} value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} aria-label="Ask a question" />
          <button type="submit" className="btn-primary px-4" disabled={loading || !input.trim()} aria-label="Send"><Send size={16} /></button>
        </form>
      </div>

      <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#5a72a0]">
        <AlertCircle size={12} /> AI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
