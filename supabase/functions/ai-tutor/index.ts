// Campus Compass — AI Doubt Solver edge function
// Uses Pollinations AI (free, no API key required) so the chat works out of the box.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT =
  "You are Campus Compass, a friendly, encouraging study tutor for college students. " +
  "Explain concepts clearly and concisely, use examples, and guide the student toward " +
  "understanding rather than just handing them answers. Keep responses focused and " +
  "under ~300 words unless the question genuinely needs more.";

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const messages: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const chatMessages: Msg[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-8)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
    ];

    // Pollinations OpenAI-compatible endpoint — no API key needed
    const aiRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: chatMessages,
        max_tokens: 600,
        temperature: 0.5,
      }),
    });

    if (!aiRes.ok) {
      return new Response(
        JSON.stringify({ error: `AI service error (${aiRes.status}).` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Try OpenAI-style JSON response first
    let reply: string | undefined;
    const contentType = aiRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await aiRes.json();
      reply = data?.choices?.[0]?.message?.content;
    } else {
      // Fallback: plain text response
      reply = await aiRes.text();
    }

    if (!reply || !reply.trim()) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI service." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ reply: reply.trim() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
