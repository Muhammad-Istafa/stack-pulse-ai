// Stack Sentinel — fetch-updates edge function
// Pulls GitHub & Hacker News updates per tool, asks Lovable AI to rank relevance, stores results.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RawUpdate {
  tool_name: string;
  title: string;
  source_url: string;
  source: "github" | "hn";
  snippet: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // verify user from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: tools } = await admin.from("stack_tools").select("tool_name, monthly_cost").eq("user_id", user.id);
    if (!tools || tools.length === 0) {
      return new Response(JSON.stringify({ error: "No stack tools found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gather raw updates
    const raw: RawUpdate[] = [];
    for (const t of tools) {
      const name = t.tool_name as string;
      try {
        const ghRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(name)}&sort=updated&per_page=3`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (ghRes.ok) {
          const gh = await ghRes.json();
          for (const r of (gh.items ?? []).slice(0, 3)) {
            raw.push({
              tool_name: name,
              title: `${r.full_name} — ${r.description ?? "Updated repository"}`.slice(0, 200),
              source_url: r.html_url,
              source: "github",
              snippet: `Stars: ${r.stargazers_count}. Updated: ${r.updated_at}. ${r.description ?? ""}`.slice(0, 300),
            });
          }
        }
      } catch (e) { console.error("gh fail", name, e); }

      try {
        const hnRes = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(name)}&tags=story&hitsPerPage=3`);
        if (hnRes.ok) {
          const hn = await hnRes.json();
          for (const h of (hn.hits ?? []).slice(0, 3)) {
            raw.push({
              tool_name: name,
              title: (h.title ?? h.story_title ?? "Untitled").slice(0, 200),
              source_url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
              source: "hn",
              snippet: `HN points: ${h.points ?? 0}, comments: ${h.num_comments ?? 0}`,
            });
          }
        }
      } catch (e) { console.error("hn fail", name, e); }
    }

    if (raw.length === 0) {
      return new Response(JSON.stringify({ saved: 0, message: "No raw updates found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stackList = tools.map((t: any) => `- ${t.tool_name} ($${t.monthly_cost}/mo)`).join("\n");
    const systemPrompt = `You are a technical intelligence analyst for a startup. The user's tech stack is:\n${stackList}\n\nGiven updates from GitHub and Hacker News, identify which are genuinely relevant to this stack. For each relevant update, write: 1) A 2-sentence plain-English summary of why it matters to this founder, 2) Whether it has a positive cost impact (saves money), negative (costs more), or neutral, 3) An urgency score from 1-10. Use the analyze_updates tool to return results. Skip irrelevant items.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Raw updates:\n${JSON.stringify(raw, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_updates",
            description: "Return relevant updates only.",
            parameters: {
              type: "object",
              properties: {
                relevant: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tool_name: { type: "string" },
                      title: { type: "string" },
                      summary: { type: "string", description: "2-sentence plain English why it matters" },
                      cost_impact: { type: "string", enum: ["positive", "negative", "neutral"] },
                      urgency_score: { type: "integer", minimum: 1, maximum: 10 },
                      source_url: { type: "string" },
                    },
                    required: ["tool_name", "title", "summary", "cost_impact", "urgency_score", "source_url"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["relevant"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_updates" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted — please add funds" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway failed");
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("no tool call", JSON.stringify(aiJson));
      return new Response(JSON.stringify({ saved: 0, message: "AI returned no analysis" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const args = JSON.parse(toolCall.function.arguments);
    const relevant = (args.relevant ?? []) as any[];

    if (relevant.length === 0) {
      return new Response(JSON.stringify({ saved: 0, message: "No relevant updates" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rows = relevant.map((r) => ({
      user_id: user.id,
      tool_name: String(r.tool_name).slice(0, 100),
      title: String(r.title).slice(0, 300),
      summary: String(r.summary).slice(0, 1000),
      cost_impact: ["positive", "negative", "neutral"].includes(r.cost_impact) ? r.cost_impact : "neutral",
      urgency_score: Math.min(10, Math.max(1, parseInt(r.urgency_score) || 5)),
      source_url: r.source_url ?? null,
    }));

    const { error: insErr } = await admin.from("updates").insert(rows);
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ saved: rows.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("fetch-updates error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
