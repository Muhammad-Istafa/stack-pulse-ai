import { useEffect, useState } from "react";
import { Cpu, Loader2, RefreshCw, Check, X, FlaskConical, GitBranch, BarChart3, Star, Code2, Sparkles, TrendingDown, Zap, ShieldCheck, Rocket, ArrowRight, ExternalLink, Brain, ShieldAlert } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";
import SimulationBadge from "@/components/SimulationBadge";
import { format } from "date-fns";

type FeedItem = {
  id: string; source: string; title: string; vendor: string; summary: string;
  github_stars: number | null; adoption: string | null; stability: string | null;
  relevance_score: number | null; potential_savings_pct: number | null;
  status: string; detected_at: string;
};

type Analysis = {
  id?: string;
  feed_id?: string;
  sandbox?: any;
  code_impact?: any;
  migration_plan?: string;
  ab_test?: any;
  decision?: string;
  status?: string;
};

const SOURCE_LABEL: Record<string, string> = { model_release: "Model release", pricing: "Pricing", github_trend: "GitHub trend" };

export default function Tech() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => { document.title = "Tech Agent · FounderOS"; }, []);
  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const { data } = await supabase.from("tech_feed")
      .select("*").eq("device_id", getDeviceId())
      .order("detected_at", { ascending: false });
    const items = (data ?? []) as FeedItem[];
    setFeed(items);
    if (items.length === 0) await generateFeed();
  }

  async function generateFeed() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("tech-agent", { body: { action: "feed" } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      const rows = (data.items ?? []).map((it: any) => ({ ...it, device_id: getDeviceId() }));
      const { data: inserted } = await supabase.from("tech_feed").insert(rows).select();
      setFeed((inserted ?? []) as FeedItem[]);
      await logActivity("tech", "generated", "Weekly intelligence feed", `${rows.length} items`);
      toast({ title: "Feed refreshed", description: `${rows.length} new items detected.` });
    } catch (e: any) {
      toast({ title: "Feed failed", description: e.message, variant: "destructive" });
    } finally { setGenerating(false); }
  }

  async function selectItem(it: FeedItem) {
    setSelected(it);
    setAnalysis(null);
    const { data } = await supabase.from("tech_analyses")
      .select("*").eq("feed_id", it.id).maybeSingle();
    if (data) setAnalysis(data as Analysis);
  }

  async function runAction(action: "sandbox" | "code_impact" | "migration" | "ab_test") {
    if (!selected) return;
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("tech-agent", { body: { action, item: selected } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);

      let next: Analysis = { ...(analysis ?? {}), feed_id: selected.id };
      if (action === "sandbox") next.sandbox = data;
      if (action === "code_impact") next.code_impact = data;
      if (action === "migration") next.migration_plan = data.migration_plan;
      if (action === "ab_test") { next.ab_test = data; next.status = "ab_running"; }

      // upsert
      if (next.id) {
        await supabase.from("tech_analyses").update(next).eq("id", next.id);
      } else {
        const { data: ins } = await supabase.from("tech_analyses")
          .insert({ ...next, device_id: getDeviceId() }).select().single();
        next = (ins as any) ?? next;
      }
      setAnalysis(next);
      await supabase.from("tech_feed").update({ status: "reviewing" }).eq("id", selected.id);
      await logActivity("tech", "generated", `${action.replace("_", " ")} · ${selected.title}`);
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally { setLoading(""); }
  }

  async function decide(decision: "switch" | "hold" | "reject") {
    if (!selected || !analysis?.id) return;
    const status = decision === "switch" ? "approved" : decision === "reject" ? "rejected" : "draft";
    await supabase.from("tech_analyses").update({ decision, status }).eq("id", analysis.id);
    await supabase.from("tech_feed").update({
      status: decision === "switch" ? "adopted" : decision === "reject" ? "rejected" : "reviewing",
    }).eq("id", selected.id);
    await logActivity("tech", decision === "reject" ? "ignored" : "approved", `${decision.toUpperCase()} · ${selected.title}`);
    setAnalysis(prev => prev ? { ...prev, decision, status } : prev);
    setFeed(prev => prev.map(f => f.id === selected.id ? { ...f, status: decision === "switch" ? "adopted" : decision === "reject" ? "rejected" : "reviewing" } : f));
    toast({ title: `Decision: ${decision}`, description: "Logged to activity feed." });
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        <header className="px-6 pt-6 pb-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Tech Intelligence Agent</h1>
              <Badge variant="secondary" className="ml-1">for Sam</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Auto-monitored feed · sandbox tested · migration ready · A/B verified.</p>
          </div>
          <Button size="sm" variant="outline" onClick={generateFeed} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh feed
          </Button>
        </header>

        <div className="flex-1 grid grid-cols-12 min-h-0">
          <aside className="col-span-4 border-r border-border min-h-0 flex flex-col">
            <div className="p-3 border-b border-border text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Intelligence feed
              <span className="ml-auto text-xs text-muted-foreground">{feed.length}</span>
            </div>
            <ScrollArea className="flex-1">
              {feed.length === 0 && !generating && (
                <div className="p-6 text-center text-xs text-muted-foreground">No feed items.</div>
              )}
              {generating && feed.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground flex items-center gap-2 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Scanning sources…
                </div>
              )}
              <ul>
                {feed.map(it => (
                  <li key={it.id}>
                    <button
                      onClick={() => selectItem(it)}
                      className={`w-full text-left px-4 py-3 border-b border-border/60 hover:bg-muted/40 ${selected?.id === it.id ? "bg-muted/60" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{SOURCE_LABEL[it.source] ?? it.source}</Badge>
                        {it.status !== "new" && <Badge variant="secondary" className="text-[9px]">{it.status}</Badge>}
                        <span className="ml-auto text-[10px] text-muted-foreground">{format(new Date(it.detected_at), "MMM d")}</span>
                      </div>
                      <div className="font-medium text-sm leading-snug">{it.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{it.vendor}</div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        {typeof it.relevance_score === "number" && (
                          <span className={`flex items-center gap-1 ${it.relevance_score >= 70 ? "text-success" : ""}`}>
                            <ShieldCheck className="h-3 w-3" /> {it.relevance_score}% match
                          </span>
                        )}
                        {it.potential_savings_pct ? (
                          <span className="flex items-center gap-1 text-success"><TrendingDown className="h-3 w-3" /> −{it.potential_savings_pct}%</span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </aside>

          <section className="col-span-8 min-h-0 overflow-auto p-6">
            {!selected ? (
              <Card className="p-12 text-center shadow-card">
                <Cpu className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Pick a feed item to test, analyze, and plan a migration.</p>
              </Card>
            ) : (
              <div className="space-y-4 max-w-4xl">
                <Card className="p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider mb-2">{SOURCE_LABEL[selected.source]}</Badge>
                      <h2 className="text-xl font-semibold tracking-tight">{selected.title}</h2>
                      <p className="text-xs text-muted-foreground">{selected.vendor}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {typeof selected.github_stars === "number" && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" /> {selected.github_stars.toLocaleString()}</span>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{selected.adoption} · {selected.stability}</Badge>
                    </div>
                  </div>
                  <p className="text-sm mt-3 leading-relaxed">{selected.summary}</p>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <Stat label="Relevance" value={`${selected.relevance_score ?? 0}%`} accent={(selected.relevance_score ?? 0) >= 70 ? "success" : "muted"} />
                    <Stat label="Potential savings" value={selected.potential_savings_pct ? `−${selected.potential_savings_pct}%` : "—"} accent="success" />
                    <Stat label="Stability" value={selected.stability ?? "—"} accent="muted" />
                  </div>
                </Card>

                {/* Action toolbar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <ActionBtn icon={FlaskConical} label="Sandbox test" onClick={() => runAction("sandbox")} loading={loading === "sandbox"} done={!!analysis?.sandbox} />
                  <ActionBtn icon={Code2} label="Code impact" onClick={() => runAction("code_impact")} loading={loading === "code_impact"} done={!!analysis?.code_impact} />
                  <ActionBtn icon={GitBranch} label="Migration plan" onClick={() => runAction("migration")} loading={loading === "migration"} done={!!analysis?.migration_plan} />
                  <ActionBtn icon={BarChart3} label="A/B test" onClick={() => runAction("ab_test")} loading={loading === "ab_test"} done={!!analysis?.ab_test} />
                </div>

                {/* Sandbox */}
                {analysis?.sandbox && (
                  <Card className="shadow-card overflow-hidden">
                    <SectionHead icon={<FlaskConical className="h-4 w-4 text-success" />} label="Sandbox test results" />
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Sample input</div>
                        <pre className="text-xs bg-muted/50 rounded p-3 whitespace-pre-wrap">{analysis.sandbox.sample_input}</pre>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="rounded border border-border p-3">
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Current</div>
                          <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{analysis.sandbox.old_output}</pre>
                          <div className="mt-3 flex gap-3 text-[11px] text-muted-foreground">
                            <span>Latency: {analysis.sandbox.latency_old_ms}ms</span>
                            <span>Cost: ${analysis.sandbox.cost_old_per_1k}/1k</span>
                          </div>
                        </div>
                        <div className="rounded border border-success/30 bg-success/5 p-3">
                          <div className="text-[11px] uppercase tracking-wider text-success mb-1 flex items-center gap-1"><Zap className="h-3 w-3" /> New</div>
                          <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{analysis.sandbox.new_output}</pre>
                          <div className="mt-3 flex gap-3 text-[11px]">
                            <span className={analysis.sandbox.latency_new_ms < analysis.sandbox.latency_old_ms ? "text-success" : "text-muted-foreground"}>Latency: {analysis.sandbox.latency_new_ms}ms</span>
                            <span className={analysis.sandbox.cost_new_per_1k < analysis.sandbox.cost_old_per_1k ? "text-success" : "text-muted-foreground"}>Cost: ${analysis.sandbox.cost_new_per_1k}/1k</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm"><span className="text-muted-foreground">Quality note: </span>{analysis.sandbox.quality_note}</div>
                      <div className="text-sm font-medium flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> {analysis.sandbox.verdict}</div>
                    </div>
                  </Card>
                )}

                {/* Code impact */}
                {analysis?.code_impact && (
                  <Card className="shadow-card overflow-hidden">
                    <SectionHead icon={<Code2 className="h-4 w-4 text-primary" />} label="Code impact" trailing={<Badge variant="outline" className="text-[10px]">risk: {analysis.code_impact.risk}</Badge>} />
                    <div className="p-5 space-y-3 text-sm">
                      <p>{analysis.code_impact.summary}</p>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Files</div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.code_impact.files.map((f: string) => (
                            <code key={f} className="text-[11px] bg-muted px-2 py-0.5 rounded">{f}</code>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Functions</div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.code_impact.functions.map((f: string) => (
                            <code key={f} className="text-[11px] bg-muted px-2 py-0.5 rounded">{f}</code>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Migration */}
                {analysis?.migration_plan && (
                  <Card className="shadow-card overflow-hidden">
                    <SectionHead icon={<GitBranch className="h-4 w-4 text-primary" />} label="Migration plan" />
                    <div className="p-5">
                      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{analysis.migration_plan}</pre>
                    </div>
                  </Card>
                )}

                {/* A/B */}
                {analysis?.ab_test && (
                  <Card className="shadow-card overflow-hidden">
                    <SectionHead icon={<BarChart3 className="h-4 w-4 text-primary" />} label="A/B test simulation" trailing={<Badge variant="secondary" className="text-[10px]">{analysis.ab_test.users_pct}% of traffic · {analysis.ab_test.duration_days}d</Badge>} />
                    <div className="p-5 grid md:grid-cols-2 gap-4">
                      <Metric label="Satisfaction" old={`${analysis.ab_test.satisfaction_old}%`} neu={`${analysis.ab_test.satisfaction_new}%`} better={analysis.ab_test.satisfaction_new > analysis.ab_test.satisfaction_old} />
                      <Metric label="p95 latency" old={`${analysis.ab_test.p95_old_ms}ms`} neu={`${analysis.ab_test.p95_new_ms}ms`} better={analysis.ab_test.p95_new_ms < analysis.ab_test.p95_old_ms} />
                      <Metric label="Error rate" old={`${analysis.ab_test.error_rate_old}%`} neu={`${analysis.ab_test.error_rate_new}%`} better={analysis.ab_test.error_rate_new < analysis.ab_test.error_rate_old} />
                      <div className="rounded border border-primary/30 bg-priority p-3">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Recommendation</div>
                        <div className="font-semibold capitalize flex items-center gap-1.5">
                          <Rocket className="h-4 w-4 text-primary" /> {analysis.ab_test.recommendation}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{analysis.ab_test.rationale}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Final decision */}
                {(analysis?.sandbox || analysis?.migration_plan) && (
                  <Card className="p-4 shadow-card flex items-center justify-between">
                    <div className="text-sm">
                      {analysis?.decision ? (
                        <Badge className={analysis.decision === "switch" ? "bg-success/20 text-success border-success/40 hover:bg-success/20" : "bg-muted text-muted-foreground"}>
                          Decision: {analysis.decision}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Awaiting your decision — nothing executes automatically.</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => decide("reject")} disabled={!!analysis?.decision}><X className="h-4 w-4" /> Reject</Button>
                      <Button variant="outline" size="sm" onClick={() => decide("hold")} disabled={!!analysis?.decision}>Hold</Button>
                      <Button size="sm" onClick={() => decide("switch")} disabled={!!analysis?.decision}><Check className="h-4 w-4" /> Approve migration</Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function ActionBtn({ icon: Icon, label, onClick, loading, done }: any) {
  return (
    <button onClick={onClick} disabled={loading} className={`group rounded-lg border p-3 text-left transition-all ${done ? "border-success/40 bg-success/5" : "border-border bg-card hover:border-primary/40"}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className={`h-4 w-4 ${done ? "text-success" : "text-primary"}`} />
        {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        {done && !loading && <Check className="h-3 w-3 text-success" />}
      </div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[11px] text-muted-foreground">{done ? "Completed" : "Run analysis"}</div>
    </button>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: "success" | "muted" }) {
  return (
    <div className="rounded border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-base font-semibold mt-0.5 ${accent === "success" ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}

function SectionHead({ icon, label, trailing }: { icon: React.ReactNode; label: string; trailing?: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-border flex items-center gap-2">
      {icon}
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  );
}

function Metric({ label, old, neu, better }: { label: string; old: string; neu: string; better: boolean }) {
  return (
    <div className="rounded border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground line-through">{old}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className={`text-base font-semibold ${better ? "text-success" : "text-destructive"}`}>{neu}</span>
      </div>
    </div>
  );
}
