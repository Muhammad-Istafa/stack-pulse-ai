import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, ArrowRight, Check, Shield } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["AI/ML", "Cloud Infrastructure", "Database", "SaaS Tool", "API Service"] as const;
const SUGGESTIONS = ["Firebase", "Vertex AI", "Cloud Run", "OpenAI", "Pinecone", "Supabase", "Vercel", "AWS Lambda", "Anthropic", "Stripe", "PostHog"];

type Tool = { tool_name: string; category: string; monthly_cost: number };

const toolSchema = z.object({
  tool_name: z.string().trim().min(1).max(80),
  category: z.enum(CATEGORIES),
  monthly_cost: z.number().min(0).max(1000000),
});

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tools, setTools] = useState<Tool[]>([]);
  const [draft, setDraft] = useState<Tool>({ tool_name: "", category: "AI/ML", monthly_cost: 0 });
  const [githubOrg, setGithubOrg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = "Onboarding · Stack Sentinel";
  }, []);

  const addTool = () => {
    const parsed = toolSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Tool name and valid cost required");
      return;
    }
    setTools((t) => [...t, parsed.data]);
    setDraft({ tool_name: "", category: draft.category, monthly_cost: 0 });
  };

  const removeTool = (i: number) => setTools((t) => t.filter((_, idx) => idx !== i));

  const total = tools.reduce((s, t) => s + Number(t.monthly_cost || 0), 0);

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (githubOrg.trim()) {
        await supabase.from("profiles").update({ github_org: githubOrg.trim() }).eq("user_id", user.id);
      }
      if (tools.length) {
        const rows = tools.map((t) => ({ ...t, user_id: user.id }));
        const { error } = await supabase.from("stack_tools").insert(rows);
        if (error) throw error;
      }
      toast.success("Stack saved");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary-gradient grid place-items-center shadow-glow">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Stack Sentinel</span>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <Card className="p-6 shadow-card">
            <h1 className="text-2xl font-semibold tracking-tight">What's your tech stack?</h1>
            <p className="text-sm text-muted-foreground mt-1">Add the tools, services, and APIs you depend on.</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_180px_120px_auto] gap-2">
              <div>
                <Label className="text-xs">Tool name</Label>
                <Input list="tool-suggestions" value={draft.tool_name} onChange={(e) => setDraft({ ...draft, tool_name: e.target.value })} placeholder="e.g. Supabase" />
                <datalist id="tool-suggestions">
                  {SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cost/mo $</Label>
                <Input type="number" min="0" value={draft.monthly_cost} onChange={(e) => setDraft({ ...draft, monthly_cost: Number(e.target.value) })} />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addTool} variant="secondary" className="gap-1"><Plus className="h-4 w-4" />Add</Button>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {tools.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{t.tool_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{t.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-muted-foreground">${t.monthly_cost}/mo</span>
                    <button onClick={() => removeTool(i)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {tools.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No tools added yet</p>}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={tools.length === 0} className="gap-1">Next <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 shadow-card">
            <h1 className="text-2xl font-semibold tracking-tight">GitHub org or repo</h1>
            <p className="text-sm text-muted-foreground mt-1">Optional — we'll use this for deeper insights later.</p>
            <div className="mt-6 space-y-2">
              <Label>GitHub org / repo</Label>
              <Input placeholder="e.g. vercel  or  vercel/next.js" value={githubOrg} onChange={(e) => setGithubOrg(e.target.value)} />
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} className="gap-1">Next <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 shadow-card">
            <h1 className="text-2xl font-semibold tracking-tight">Confirm your stack</h1>
            <p className="text-sm text-muted-foreground mt-1">We'll start scanning these for relevant intel.</p>

            <div className="mt-6 space-y-2">
              {tools.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{t.tool_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{t.category}</span>
                  </div>
                  <span className="text-sm tabular-nums">${t.monthly_cost}/mo</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
              <span className="text-sm text-muted-foreground">Total monthly spend</span>
              <span className="text-2xl font-semibold tabular-nums">${total.toLocaleString()}</span>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={finish} disabled={busy} className="gap-1 bg-primary-gradient shadow-glow">
                <Check className="h-4 w-4" /> {busy ? "Saving…" : "Finish setup"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
