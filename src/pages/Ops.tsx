import { useEffect, useState } from "react";
import { Briefcase, Loader2, RefreshCw, Check, Pencil, Mail } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";

const MOCK_CONTEXT = {
  company: "Northwind",
  mrr_usd: 48200,
  mrr_growth_wow: 0.18,
  active_customers: 142,
  recent_thread_summary:
    "Investor (Sarah at Acme Ventures) last asked on Mar 12 about MRR trajectory and customer concentration. We replied with Q1 numbers and promised a follow-up after Mar close.",
  top_customers: ["Linear", "Vercel", "Cal.com"],
};

const SUGGESTIONS = [
  "Reply to investor about MRR",
  "Draft monthly investor update",
  "Reply to Y Combinator partner re: progress",
  "Reply to customer Linear about quarterly check-in",
];

export default function Ops() {
  const [prompt, setPrompt] = useState(SUGGESTIONS[0]);
  const [output, setOutput] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => { document.title = "Ops Agent · FounderOS"; }, []);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setApproved(false);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("ops-agent", {
        body: { prompt, context: MOCK_CONTEXT },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.output || "");
      await logActivity("ops", "generated", prompt, "Draft generated");
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    await supabase.from("ops_tasks").insert({
      device_id: getDeviceId(),
      prompt,
      context: MOCK_CONTEXT,
      output,
      status: "approved",
    });
    await logActivity("ops", "approved", prompt, output.slice(0, 200));
    setApproved(true);
    toast({ title: "Task completed", description: "Logged to your activity feed." });
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <header>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Ops Agent</h1>
            <Badge variant="secondary" className="ml-1">for Paul</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Describe a problem. The agent fetches context, drafts the message, and waits for your approval.
          </p>
        </header>

        <Card className="p-5 shadow-card space-y-3">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Problem</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="e.g. Reply to investor about MRR"
          />
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted text-muted-foreground"
              >{s}</button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {loading ? "Drafting…" : "Generate draft"}
            </Button>
          </div>
        </Card>

        {(output || loading) && (
          <Card className="shadow-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Generated draft</span>
                {approved && <Badge className="bg-success/20 text-success border-success/40 hover:bg-success/20">✓ Approved</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">Context: MRR ${MOCK_CONTEXT.mrr_usd.toLocaleString()} · {MOCK_CONTEXT.active_customers} customers</div>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching context, drafting reply…
                </div>
              ) : editing ? (
                <Textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={16} className="font-mono text-sm" />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{output}</pre>
              )}
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                <Pencil className="h-4 w-4" /> {editing ? "Done editing" : "Edit"}
              </Button>
              <Button size="sm" onClick={approve} disabled={approved || loading}>
                <Check className="h-4 w-4" /> Approve
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
