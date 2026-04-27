import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-3-flash-preview";

async function callAI(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, ...body }),
  });
  if (resp.status === 429) throw new Error("RATE_LIMIT");
  if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!resp.ok) {
    console.error("AI gateway error", resp.status, await resp.text());
    throw new Error("AI_ERROR");
  }
  return await resp.json();
}

const ok = (d: unknown) => new Response(JSON.stringify(d), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
const err = (m: string, s = 500) => new Response(JSON.stringify({ error: m }), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const STACK_CONTEXT =
  "Current stack: TypeScript + Node API on Fly.io. LLM: OpenAI gpt-4o-mini for chat, text-embedding-3-small for embeddings, Pinecone vector DB. Postgres on Supabase. Background jobs on Inngest.";

async function generateFeed() {
  const data = await callAI({
    messages: [
      { role: "system", content: `You are the Tech Intelligence agent. Invent a believable weekly feed of 5 items relevant to this stack. Mix model_release, pricing, and github_trend. ${STACK_CONTEXT}` },
      { role: "user", content: "Generate this week's intelligence feed." },
    ],
    tools: [{
      type: "function",
      function: {
        name: "feed",
        parameters: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string", enum: ["model_release", "pricing", "github_trend"] },
                  title: { type: "string" },
                  vendor: { type: "string" },
                  summary: { type: "string" },
                  github_stars: { type: "number" },
                  adoption: { type: "string", enum: ["early", "growing", "mainstream"] },
                  stability: { type: "string", enum: ["experimental", "stable", "production"] },
                  relevance_score: { type: "number" },
                  potential_savings_pct: { type: "number" },
                },
                required: ["source", "title", "vendor", "summary", "adoption", "stability", "relevance_score"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "feed" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { items: [] };
}

async function sandboxTest({ item }: any) {
  const data = await callAI({
    messages: [
      { role: "system", content: `Simulate a sandbox test comparing the proposed tool with the current stack. Invent realistic numbers. ${STACK_CONTEXT}` },
      { role: "user", content: `Proposed: ${item.title} (${item.vendor})\nSummary: ${item.summary}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "sandbox",
        parameters: {
          type: "object",
          properties: {
            sample_input: { type: "string" },
            old_output: { type: "string" },
            new_output: { type: "string" },
            latency_old_ms: { type: "number" },
            latency_new_ms: { type: "number" },
            cost_old_per_1k: { type: "number" },
            cost_new_per_1k: { type: "number" },
            quality_note: { type: "string" },
            verdict: { type: "string" },
          },
          required: ["sample_input", "old_output", "new_output", "latency_old_ms", "latency_new_ms", "cost_old_per_1k", "cost_new_per_1k", "quality_note", "verdict"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "sandbox" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : {};
}

async function codeImpact({ item }: any) {
  const data = await callAI({
    messages: [
      { role: "system", content: `Identify the (mock but plausible) files and functions in the codebase that would change if we adopted this tool. ${STACK_CONTEXT}` },
      { role: "user", content: `Proposed: ${item.title} (${item.vendor}) — ${item.summary}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "impact",
        parameters: {
          type: "object",
          properties: {
            files: { type: "array", items: { type: "string" } },
            functions: { type: "array", items: { type: "string" } },
            risk: { type: "string", enum: ["low", "medium", "high"] },
            summary: { type: "string" },
          },
          required: ["files", "functions", "risk", "summary"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "impact" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { files: [], functions: [], risk: "medium", summary: "" };
}

async function migrationPlan({ item }: any) {
  const data = await callAI({
    messages: [
      { role: "system", content: `Write a concrete numbered migration plan (5-8 steps): code/config changes, dependency updates, env vars, rollout, rollback. Plain text with line breaks, no markdown. ${STACK_CONTEXT}` },
      { role: "user", content: `Migrate to: ${item.title} (${item.vendor}) — ${item.summary}` },
    ],
  });
  return { migration_plan: data.choices?.[0]?.message?.content ?? "" };
}

async function abTest({ item }: any) {
  const data = await callAI({
    messages: [
      { role: "system", content: "Simulate an A/B test result with realistic numbers and a final recommendation." },
      { role: "user", content: `Tool: ${item.title}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "ab",
        parameters: {
          type: "object",
          properties: {
            users_pct: { type: "number" },
            duration_days: { type: "number" },
            satisfaction_old: { type: "number" },
            satisfaction_new: { type: "number" },
            p95_old_ms: { type: "number" },
            p95_new_ms: { type: "number" },
            error_rate_old: { type: "number" },
            error_rate_new: { type: "number" },
            recommendation: { type: "string", enum: ["switch", "hold", "reject"] },
            rationale: { type: "string" },
          },
          required: ["users_pct", "duration_days", "satisfaction_old", "satisfaction_new", "p95_old_ms", "p95_new_ms", "error_rate_old", "error_rate_new", "recommendation", "rationale"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "ab" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : {};
}

async function decisionPanel({ item, analysis }: any) {
  const data = await callAI({
    messages: [
      {
        role: "system",
        content:
          `You are the Tech Decision Architect. Synthesize a final recommendation for switching to a new tool. Use sandbox + code impact + A/B results when present. Always include 2-4 plausible source citations (vendor docs URL, pricing page, GitHub repo, benchmark blog post). Be conservative on risk and confidence. ${STACK_CONTEXT}`,
      },
      {
        role: "user",
        content: `Tool: ${item.title} (${item.vendor})\nSummary: ${item.summary}\nAnalysis context: ${JSON.stringify({
          sandbox: analysis?.sandbox,
          code_impact: analysis?.code_impact,
          ab_test: analysis?.ab_test,
          has_migration_plan: !!analysis?.migration_plan,
        })}`,
      },
    ],
    tools: [{
      type: "function",
      function: {
        name: "decision",
        parameters: {
          type: "object",
          properties: {
            decision: { type: "string", enum: ["switch", "hold", "reject"] },
            confidence: { type: "number", description: "0-100" },
            risk_level: { type: "string", enum: ["low", "medium", "high"] },
            rationale: { type: "string", description: "2-3 sentence summary fitted to the founder's stack" },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["docs", "pricing", "github", "benchmark", "blog", "release_notes"] },
                  title: { type: "string" },
                  url: { type: "string", description: "Plausible canonical URL" },
                  why_it_matters: { type: "string", description: "1 line — why this source supports the recommendation" },
                },
                required: ["type", "title", "url", "why_it_matters"],
                additionalProperties: false,
              },
            },
          },
          required: ["decision", "confidence", "risk_level", "rationale", "sources"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "decision" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { decision: "hold", confidence: 50, risk_level: "medium", rationale: "", sources: [] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const action = body.action as string;
    let result;
    switch (action) {
      case "feed": result = await generateFeed(); break;
      case "sandbox": result = await sandboxTest(body); break;
      case "code_impact": result = await codeImpact(body); break;
      case "migration": result = await migrationPlan(body); break;
      case "ab_test": result = await abTest(body); break;
      case "decision_panel": result = await decisionPanel(body); break;
      default: return err("Unknown action", 400);
    }
    return ok(result);
  } catch (e: any) {
    const msg = e?.message ?? "Unknown";
    if (msg === "RATE_LIMIT") return err("Rate limit reached. Try again shortly.", 429);
    if (msg === "PAYMENT_REQUIRED") return err("AI credits exhausted. Add credits in Settings → Workspace → Usage.", 402);
    console.error("tech-agent error", e);
    return err(msg);
  }
});
