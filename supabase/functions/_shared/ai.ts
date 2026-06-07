import { aiTokenLimit } from "./guard.ts";

type AIProvider = "groq" | "lovable" | "gemini";

function resolveProvider(): { provider: AIProvider; apiKey: string; model: string; url: string } {
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      model: "llama-3.3-70b-versatile",
      url: "https://api.groq.com/openai/v1/chat/completions",
    };
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      model: "gemini-2.0-flash",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    };
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    return {
      provider: "lovable",
      apiKey: lovableKey,
      model: "google/gemini-3-flash-preview",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    };
  }

  throw new Error("No AI API key configured. Set GROQ_API_KEY, GEMINI_API_KEY, or LOVABLE_API_KEY in Supabase secrets.");
}

export async function callAI(body: Record<string, unknown>) {
  const { apiKey, model, url } = resolveProvider();
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, max_tokens: aiTokenLimit(), ...body }),
  });
  if (resp.status === 429) throw new Error("RATE_LIMIT");
  if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI gateway error", resp.status, t);
    throw new Error("AI_ERROR");
  }
  return await resp.json();
}
