import { useEffect, useState } from "react";
import { Cpu, Loader2, RefreshCw, Check, X, Lightbulb, FlaskConical, GitBranch } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";

const SUGGESTIONS = [
  "Reduce API cost",
  "Cut p95 latency on /search",
  "Pick a vector DB for 50M embeddings",
  "Migrate from Heroku to fly.io",
];

type Result = { recommendation: string; sandbox_test: string; migration_plan: string };

export default function Tech() {
  const [prompt, setPrompt] = useState(SUGGESTIONS[0]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"draft" | "approved" | "ignored">("draft");

  useEffect(() => { document.title = "Tech Agent · FounderOS"; }, []);

  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    setStatus("draft");
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("tech-agent", { body: { prompt } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as Result);
      await logActivity("tech", "generated", prompt, "3-stage analysis prepared");
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function decide(decision: "approved" | "ignored") {
    if (!result) return;
    await supabase.from("tech_tasks").insert({
      device_id: getDeviceId(),
      prompt,
      recommendation: result.recommendation,
      sandbox_test: result.sandbox_test,
      migration_plan: result.migration_plan,
      status: decision,
    });
    await logActivity("tech", decision, prompt, result.recommendation.slice(0, 200));
    setStatus(decision);
    toast({
      title: decision === "approved" ? "Plan approved" : "Recommendation ignored",
      description: decision === "approved" ? "Logged to activity feed. Execute when ready." : "Won't surface again.",
    });
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <header>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Tech Agent</h1>
            <Badge variant="secondary" className="ml-1">for Sam</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Describe a technical problem. Get a recommendation, a sandbox test, and a migration plan.
          </p>
        </header>

        <Card className="p-5 shadow-card space-y-3">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Problem</label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} placeholder="e.g. Reduce API cost" />
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
            <Button onClick={run} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              {loading ? "Analyzing…" : "Analyze"}
            </Button>
          </div>
        </Card>

        {loading && (
          <Card className="p-6 shadow-card text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Running 3-stage analysis…
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <Stage icon={<Lightbulb className="h-4 w-4 text-warning" />} label="1 · Recommendation" body={result.recommendation} accent="border-warning/30 bg-priority" />
            <Stage icon={<FlaskConical className="h-4 w-4 text-success" />} label="2 · Sandbox Test" body={result.sandbox_test} accent="" />
            <Stage icon={<GitBranch className="h-4 w-4 text-primary" />} label="3 · Migration Plan" body={result.migration_plan} accent="" mono />

            <Card className="p-4 shadow-card flex items-center justify-between">
              <div className="text-sm">
                {status === "draft" && <span className="text-muted-foreground">Awaiting your decision — nothing executes automatically.</span>}
                {status === "approved" && <Badge className="bg-success/20 text-success border-success/40 hover:bg-success/20">✓ Approved & logged</Badge>}
                {status === "ignored" && <Badge variant="secondary">Ignored</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={run}><RefreshCw className="h-4 w-4" /> Re-run</Button>
                <Button variant="outline" size="sm" onClick={() => decide("ignored")} disabled={status !== "draft"}>
                  <X className="h-4 w-4" /> Ignore
                </Button>
                <Button size="sm" onClick={() => decide("approved")} disabled={status !== "draft"}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Stage({ icon, label, body, accent, mono }: { icon: React.ReactNode; label: string; body: string; accent: string; mono?: boolean }) {
  return (
    <Card className={`shadow-card overflow-hidden ${accent}`}>
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        {icon}
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="p-5">
        <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${mono ? "font-mono" : "font-sans"}`}>{body}</pre>
      </div>
    </Card>
  );
}
