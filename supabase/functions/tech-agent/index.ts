import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are the Tech Agent inside FounderOS — an AI co-founder for a technical founder named Sam.
You convert technical problems into tested, implementable plans.

For every problem, return a JSON object via the analyze_tech_problem tool with three fields:
1. "recommendation" — 2-4 sentences. Concrete proposal with a comparison and a measurable benefit (cost %, latency, etc). You may invent realistic mock numbers.
2. "sandbox_test" — 2-3 sentences describing a simulated test result on a representative input, with pass/fail and any quality observation.
3. "migration_plan" — a numbered list (4-6 steps) of exact engineering actions: code/config to change, dependencies to update, rollout, rollback. Plain text with line breaks, no markdown.

Be specific to the problem. Never auto-execute — this is a recommendation only.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Technical problem: ${prompt}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_tech_problem",
            description: "Return the 3-stage tech analysis.",
            parameters: {
              type: "object",
              properties: {
                recommendation: { type: "string" },
                sandbox_test: { type: "string" },
                migration_plan: { type: "string" },
              },
              required: ["recommendation", "sandbox_test", "migration_plan"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_tech_problem" } },
      }),
    });

    if (resp.status === 429)
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402)
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("tech-agent gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { recommendation: "", sandbox_test: "", migration_plan: "" };
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("tech-agent error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
