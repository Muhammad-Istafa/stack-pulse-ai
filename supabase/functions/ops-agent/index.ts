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
    const t = await resp.text();
    console.error("AI gateway error", resp.status, t);
    throw new Error("AI_ERROR");
  }
  return await resp.json();
}

function err(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ---------- Actions ----------

async function classifyEmail({ subject, body, sender }: any) {
  const data = await callAI({
    messages: [
      { role: "system", content: "You classify founder inbox emails. Return JSON via tool." },
      { role: "user", content: `From: ${sender}\nSubject: ${subject}\n\n${body}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "classify",
        description: "Classify an inbox email",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["cold", "important", "action_required"] },
            importance: { type: "string", enum: ["low", "normal", "high"] },
            reason: { type: "string" },
          },
          required: ["category", "importance", "reason"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "classify" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { category: "important", importance: "normal", reason: "" };
}

async function extractTask({ subject, body, sender }: any) {
  const data = await callAI({
    messages: [
      { role: "system", content: "Extract the underlying actionable task in this email." },
      { role: "user", content: `From: ${sender}\nSubject: ${subject}\n\n${body}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "extract",
        description: "Extract the task hidden in the email",
        parameters: {
          type: "object",
          properties: {
            intent: { type: "string", description: "1 sentence task statement, e.g. 'Send latest MRR report'" },
            urgency: { type: "string", enum: ["low", "medium", "high"] },
            data_sources: {
              type: "array",
              items: { type: "string", enum: ["google_sheets", "notion", "calendar", "gmail", "stripe", "hubspot"] },
            },
            reasoning: { type: "string" },
          },
          required: ["intent", "urgency", "data_sources", "reasoning"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "extract" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { intent: "Reply", urgency: "medium", data_sources: ["gmail"], reasoning: "" };
}

async function generateWorkflow({ problem, sources }: any) {
  const data = await callAI({
    messages: [
      {
        role: "system",
        content:
          "You design 3-5 step workflows for a founder Ops agent. Each step has a tool. The final step is always 'Draft reply' or 'Draft message'. Be specific to the problem.",
      },
      { role: "user", content: `Problem: ${problem}\nAvailable data sources: ${(sources ?? []).join(", ") || "gmail"}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "design_workflow",
        description: "Design an executable workflow",
        parameters: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Short step name, e.g. 'Fetch MRR from Google Sheets'" },
                  tool: { type: "string", enum: ["google_sheets", "notion", "calendar", "gmail", "stripe", "hubspot", "format", "ai_draft"] },
                  description: { type: "string" },
                },
                required: ["name", "tool", "description"],
                additionalProperties: false,
              },
            },
          },
          required: ["steps"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "design_workflow" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { steps: [] };
}

// Mock data sources — return realistic-looking strings
function mockToolRun(tool: string): { ok: boolean; output: string; error?: string } {
  switch (tool) {
    case "google_sheets":
      return {
        ok: true,
        output:
          "Sheet 'MRR Tracker' · last updated 2h ago\n• Apr MRR: $48,200 (+18% WoW)\n• Active customers: 142 (+9 net new)\n• Top 3 by ARR: Linear, Vercel, Cal.com\n• Churned this month: 2 (Acme, Globex — both <$200/mo)",
      };
    case "notion":
      return {
        ok: true,
        output:
          "Notion page 'Investor Updates Q2' · 3 sections found\n• Last update sent: Mar 31\n• Promised follow-up: 'Q1 close numbers + churn analysis'\n• Tone: concise, numbers-first",
      };
    case "calendar":
      return { ok: true, output: "Google Calendar · next 7 days\n• Tue 2pm — Linear quarterly review\n• Thu 10am — Acme Ventures partner call" };
    case "gmail":
      return { ok: true, output: "Gmail thread context\n• 4 prior messages with this sender\n• Last reply 11 days ago" };
    case "stripe":
      return { ok: true, output: "Stripe · MTD revenue $48,200 · 142 active subs · 0 failed payments" };
    case "hubspot":
      return { ok: true, output: "HubSpot · contact stage: Customer · last touch 11d ago · 3 open deals" };
    case "format":
      return { ok: true, output: "Formatted summary block ready for inclusion in reply." };
    case "ai_draft":
      return { ok: true, output: "Draft generated by AI step." };
    default:
      return { ok: false, output: "", error: "Unknown tool" };
  }
}

async function runWorkflow({ steps, problem, simulate_error }: any) {
  // Run steps sequentially with mock outputs. Optionally inject one error for demo.
  const ran: any[] = [];
  let dataBundle = "";
  const errorAt = simulate_error ? Math.max(0, Math.floor(steps.length / 2) - 1) : -1;

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (i === errorAt) {
      ran.push({ ...s, status: "error", error: "Data source mismatch — column 'mrr_usd' not found in Sheet1.", output: null });
      return { steps: ran, status: "error", final_output: null, error_message: "Workflow halted at step " + (i + 1) };
    }
    const r = mockToolRun(s.tool);
    ran.push({ ...s, status: r.ok ? "done" : "error", output: r.output, error: r.error ?? null });
    if (r.output) dataBundle += `\n[${s.name}]\n${r.output}\n`;
  }

  // Final AI draft using accumulated context
  const data = await callAI({
    messages: [
      {
        role: "system",
        content:
          "You are Paul's Ops agent. Using the tool outputs below, draft the final email/message. Output ONLY the message body with a 'Subject:' line at the top. Sign as 'Paul'. Concise, warm, numbers-first.",
      },
      { role: "user", content: `Problem: ${problem}\n\nTool outputs:${dataBundle}` },
    ],
  });
  const final_output = data.choices?.[0]?.message?.content ?? "";
  return { steps: ran, status: "awaiting_approval", final_output, error_message: null };
}

async function extractCommitments({ subject, body, sender }: any) {
  const data = await callAI({
    messages: [
      {
        role: "system",
        content:
          "You extract concrete COMMITMENTS from a founder's email — promises made, requested actions, and explicit or inferred deadlines. Be conservative: only return things that look like real obligations. Today is " +
          new Date().toISOString().slice(0, 10) + ". Use ISO dates for deadlines. Owner is 'founder' if Paul (recipient) owes it, 'counterparty' if the sender owes it.",
      },
      { role: "user", content: `From: ${sender}\nSubject: ${subject}\n\n${body}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "extract_commitments",
        parameters: {
          type: "object",
          properties: {
            commitments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task: { type: "string", description: "Short imperative task, e.g. 'Send onboarding doc to Linear'" },
                  owner: { type: "string", enum: ["founder", "counterparty"] },
                  source_quote: { type: "string", description: "Exact phrase from the email that implies the commitment" },
                  deadline_iso: { type: "string", description: "ISO 8601 datetime, or empty string if none" },
                },
                required: ["task", "owner", "source_quote", "deadline_iso"],
                additionalProperties: false,
              },
            },
          },
          required: ["commitments"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "extract_commitments" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { commitments: [] };
}

async function summarizeEmail({ subject, body, sender }: any) {
  const data = await callAI({
    messages: [
      { role: "system", content: "Summarize this email in ONE crisp sentence (max 18 words). No fluff. State what they want." },
      { role: "user", content: `From: ${sender}\nSubject: ${subject}\n\n${body}` },
    ],
  });
  return { summary: (data.choices?.[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "") };
}

async function explainRisk({ score, signals }: any) {
  const data = await callAI({
    messages: [
      {
        role: "system",
        content:
          "You are the FounderOS Risk Analyst. In 1-2 sentences, explain why the startup risk score is what it is and what the founder should do next. Be direct, calm, specific. No emojis. No 'as an AI'.",
      },
      { role: "user", content: `Score: ${score}/100\nSignals:\n${JSON.stringify(signals, null, 2)}` },
    ],
  });
  return { explanation: (data.choices?.[0]?.message?.content ?? "").trim() };
}

async function suggestCalendar({ problem, output }: any) {
  const data = await callAI({
    messages: [
      { role: "system", content: "Decide if a follow-up calendar event should be auto-suggested. If yes, propose one." },
      { role: "user", content: `Problem: ${problem}\nDraft sent:\n${(output ?? "").slice(0, 800)}` },
    ],
    tools: [{
      type: "function",
      function: {
        name: "suggest",
        parameters: {
          type: "object",
          properties: {
            create: { type: "boolean" },
            title: { type: "string" },
            detail: { type: "string" },
            days_from_now: { type: "number" },
          },
          required: ["create"],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: "function", function: { name: "suggest" } },
  });
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { create: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const action = body.action as string;
    let result;
    switch (action) {
      case "classify": result = await classifyEmail(body); break;
      case "extract": result = await extractTask(body); break;
      case "summarize": result = await summarizeEmail(body); break;
      case "extract_commitments": result = await extractCommitments(body); break;
      case "explain_risk": result = await explainRisk(body); break;
      case "generate_workflow": result = await generateWorkflow(body); break;
      case "run_workflow": result = await runWorkflow(body); break;
      case "suggest_calendar": result = await suggestCalendar(body); break;
      default: return err("Unknown action", 400);
    }
    return ok(result);
  } catch (e: any) {
    const msg = e?.message ?? "Unknown";
    if (msg === "RATE_LIMIT") return err("Rate limit reached. Try again shortly.", 429);
    if (msg === "PAYMENT_REQUIRED") return err("AI credits exhausted. Add credits in Settings → Workspace → Usage.", 402);
    console.error("ops-agent error", e);
    return err(msg);
  }
});
