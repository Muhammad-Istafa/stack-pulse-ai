import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Inbox } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { getDeviceId } from "@/lib/deviceId";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Update = {
  id: string;
  tool_name: string;
  title: string;
  summary: string;
  cost_impact: "positive" | "negative" | "neutral";
  urgency_score: number;
  source_url: string | null;
  created_at: string;
};

type Tool = { id: string; tool_name: string; monthly_cost: number };

function urgencyBadge(score: number) {
  if (score >= 8) return <Badge className="bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/20">🔴 Act Now</Badge>;
  if (score >= 5) return <Badge className="bg-warning/20 text-warning border-warning/40 hover:bg-warning/20">🟡 Worth Reading</Badge>;
  return <Badge variant="secondary">⚪ FYI</Badge>;
}

function costBadge(impact: Update["cost_impact"]) {
  if (impact === "positive") return <Badge className="bg-success/20 text-success border-success/40 hover:bg-success/20">💰 Saves Money</Badge>;
  if (impact === "negative") return <Badge className="bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/20">📈 Costs More</Badge>;
  return <Badge variant="secondary">➖ Neutral</Badge>;
}

export default function Dashboard() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Dashboard · Stack Sentinel"; }, []);

  useEffect(() => {
    const deviceId = getDeviceId();
    (async () => {
      const [{ data: u }, { data: t }] = await Promise.all([
        supabase.from("updates").select("*").eq("user_id", deviceId).order("urgency_score", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("stack_tools").select("id, tool_name, monthly_cost").eq("user_id", deviceId),
      ]);
      setUpdates((u as Update[]) ?? []);
      setTools((t as Tool[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const top = updates.slice(0, 2);
  const rest = updates.slice(2);
  const total = tools.reduce((s, t) => s + Number(t.monthly_cost || 0), 0);

  return (
    <AppLayout>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6 min-w-0">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">This Week's Intelligence</h2>
            </div>
            {loading ? (
              <Card className="p-6 bg-priority border-warning/30">Loading…</Card>
            ) : top.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {top.map((u) => (
                  <Card key={u.id} className="p-5 bg-priority border-warning/30 shadow-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-background/50 border border-border">{u.tool_name}</span>
                          {urgencyBadge(u.urgency_score)}
                          {costBadge(u.cost_impact)}
                        </div>
                        <h3 className="font-semibold text-base">{u.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{u.summary}</p>
                      </div>
                      {u.source_url && (
                        <a href={u.source_url} target="_blank" rel="noreferrer" className="text-primary text-sm flex items-center gap-1 shrink-0">
                          Read <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">All Updates</h2>
            {rest.length === 0 && !loading && top.length > 0 && (
              <p className="text-sm text-muted-foreground">No additional updates.</p>
            )}
            <div className="space-y-3">
              {rest.map((u) => (
                <Card key={u.id} className="p-4 shadow-card">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded bg-muted grid place-items-center text-xs font-mono shrink-0">
                        {u.tool_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium truncate">{u.tool_name}</span>
                      <span className="text-xs text-muted-foreground">· {format(new Date(u.created_at), "MMM d")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {urgencyBadge(u.urgency_score)}
                      {costBadge(u.cost_impact)}
                    </div>
                  </div>
                  <h3 className="font-medium">{u.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{u.summary}</p>
                  {u.source_url && (
                    <a href={u.source_url} target="_blank" rel="noreferrer" className="text-primary text-xs flex items-center gap-1 mt-2">
                      Read more <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Your Stack</h2>
          <Card className="p-4 shadow-card">
            <div className="space-y-2">
              {tools.map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{t.tool_name}</span>
                  <span className="tabular-nums text-muted-foreground">${Number(t.monthly_cost).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
              <span className="text-xs uppercase text-muted-foreground tracking-wider">Total / mo</span>
              <span className="font-semibold tabular-nums">${total.toLocaleString()}</span>
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 shadow-card text-center">
      <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Your intelligence feed is empty — click <span className="text-foreground font-medium">"Fetch Updates"</span> in Settings to run your first scan.
      </p>
    </Card>
  );
}
