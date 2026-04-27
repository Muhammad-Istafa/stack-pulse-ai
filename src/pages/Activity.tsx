import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { Activity as ActivityIcon, Briefcase, Cpu, ChevronDown, Mail, FlaskConical, GitBranch, BarChart3, Workflow } from "lucide-react";
import { WorkflowDiagram } from "@/components/WorkflowDiagram";

type Row = { id: string; agent: string; action: string; title: string; detail: string | null; created_at: string };
type Workflow = { id: string; problem: string; steps: any[]; final_output: string | null; status: string; created_at: string; trigger: string };
type TechRow = { id: string; feed_id: string; sandbox: any; code_impact: any; migration_plan: string | null; ab_test: any; decision: string | null; status: string; created_at: string };
type FeedRow = { id: string; title: string; vendor: string };

export default function ActivityPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [techRows, setTechRows] = useState<TechRow[]>([]);
  const [feedMap, setFeedMap] = useState<Record<string, FeedRow>>({});
  const [tab, setTab] = useState("timeline");

  useEffect(() => { document.title = "Activity · FounderOS"; }, []);
  useEffect(() => {
    const did = getDeviceId();
    Promise.all([
      supabase.from("activity_log").select("*").eq("device_id", did).order("created_at", { ascending: false }),
      supabase.from("workflows").select("*").eq("device_id", did).order("created_at", { ascending: false }),
      supabase.from("tech_analyses").select("*").eq("device_id", did).order("created_at", { ascending: false }),
      supabase.from("tech_feed").select("id,title,vendor").eq("device_id", did),
    ]).then(([a, w, t, f]) => {
      setItems((a.data ?? []) as Row[]);
      setWorkflows((w.data ?? []) as Workflow[]);
      setTechRows((t.data ?? []) as TechRow[]);
      const map: Record<string, FeedRow> = {};
      (f.data ?? []).forEach((it: any) => { map[it.id] = it; });
      setFeedMap(map);
    });
  }, []);

  const groups: Record<string, Row[]> = {};
  for (const r of items) {
    const k = format(new Date(r.created_at), "MMMM d, yyyy");
    (groups[k] ??= []).push(r);
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <header>
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Every workflow, sandbox test, migration, and decision — in full detail.</p>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="timeline"><ActivityIcon className="h-3.5 w-3.5 mr-1" /> Timeline</TabsTrigger>
            <TabsTrigger value="workflows"><Workflow className="h-3.5 w-3.5 mr-1" /> Workflows ({workflows.length})</TabsTrigger>
            <TabsTrigger value="tech"><Cpu className="h-3.5 w-3.5 mr-1" /> Tech analyses ({techRows.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6 mt-4">
            {items.length === 0 ? (
              <Card className="p-10 text-center shadow-card text-sm text-muted-foreground">
                No activity yet. Use the Ops or Tech agent to generate your first action.
              </Card>
            ) : (
              Object.entries(groups).map(([date, rows]) => (
                <div key={date}>
                  <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{date}</h2>
                  <div className="relative pl-6 border-l border-border space-y-3">
                    {rows.map((r) => (
                      <div key={r.id} className="relative">
                        <div className="absolute -left-[27px] top-2 h-3 w-3 rounded-full bg-primary shadow-glow" />
                        <Card className="p-4 shadow-card">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              {r.agent === "ops" ? <Briefcase className="h-3.5 w-3.5 text-primary" /> : <Cpu className="h-3.5 w-3.5 text-primary" />}
                              <span className="text-xs uppercase tracking-wider text-muted-foreground">{r.agent} agent</span>
                              <ActionBadge action={r.action} />
                            </div>
                            <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "h:mm a")}</span>
                          </div>
                          <div className="font-medium">{r.title}</div>
                          {r.detail && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-4">{r.detail}</p>}
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="workflows" className="space-y-3 mt-4">
            {workflows.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">No workflows yet.</Card>
            ) : workflows.map(w => (
              <Collapsible key={w.id}>
                <Card className="shadow-card overflow-hidden">
                  <CollapsibleTrigger className="w-full text-left">
                    <div className="p-4 flex items-center gap-3">
                      <Workflow className="h-4 w-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-1">{w.problem}</div>
                        <div className="text-xs text-muted-foreground">{w.trigger} · {w.steps?.length ?? 0} steps · {formatDistanceToNow(new Date(w.created_at), { addSuffix: true })}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{w.status}</Badge>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border p-4 space-y-3">
                      <WorkflowDiagram steps={w.steps ?? []} />
                      {w.final_output && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Final output</div>
                          <pre className="text-xs whitespace-pre-wrap font-sans bg-muted/40 rounded p-3 leading-relaxed">{w.final_output}</pre>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </TabsContent>

          <TabsContent value="tech" className="space-y-3 mt-4">
            {techRows.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">No tech analyses yet.</Card>
            ) : techRows.map(t => {
              const f = feedMap[t.feed_id];
              return (
                <Collapsible key={t.id}>
                  <Card className="shadow-card overflow-hidden">
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="p-4 flex items-center gap-3">
                        <Cpu className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium line-clamp-1">{f?.title ?? "Tech analysis"}</div>
                          <div className="text-xs text-muted-foreground">{f?.vendor} · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</div>
                        </div>
                        {t.decision && <Badge className={t.decision === "switch" ? "bg-success/20 text-success border-success/40 hover:bg-success/20 text-[10px]" : "text-[10px]"} variant={t.decision === "switch" ? "default" : "secondary"}>{t.decision}</Badge>}
                        <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border p-4 space-y-4 text-sm">
                        {t.sandbox && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><FlaskConical className="h-3 w-3" /> Sandbox</div>
                            <p>{t.sandbox.verdict} — {t.sandbox.quality_note}</p>
                            <div className="text-xs text-muted-foreground mt-1">Latency {t.sandbox.latency_old_ms}→{t.sandbox.latency_new_ms}ms · Cost ${t.sandbox.cost_old_per_1k}→${t.sandbox.cost_new_per_1k}/1k</div>
                          </div>
                        )}
                        {t.code_impact && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Code impact (risk: {t.code_impact.risk})</div>
                            <p className="text-xs">{t.code_impact.summary}</p>
                          </div>
                        )}
                        {t.migration_plan && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><GitBranch className="h-3 w-3" /> Migration</div>
                            <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/40 rounded p-3 leading-relaxed">{t.migration_plan}</pre>
                          </div>
                        )}
                        {t.ab_test && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> A/B test</div>
                            <p className="text-xs">{t.ab_test.recommendation.toUpperCase()} — {t.ab_test.rationale}</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function ActionBadge({ action }: { action: string }) {
  if (action === "approved") return <Badge className="bg-success/20 text-success border-success/40 hover:bg-success/20">approved</Badge>;
  if (action === "ignored") return <Badge variant="secondary">ignored</Badge>;
  return <Badge variant="outline">{action}</Badge>;
}
