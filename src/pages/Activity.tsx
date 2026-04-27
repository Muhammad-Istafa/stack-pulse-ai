import { useEffect, useState } from "react";
import { format } from "date-fns";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { Activity as ActivityIcon, Briefcase, Cpu } from "lucide-react";

type Row = { id: string; agent: string; action: string; title: string; detail: string | null; created_at: string };

export default function ActivityPage() {
  const [items, setItems] = useState<Row[]>([]);

  useEffect(() => { document.title = "Activity · FounderOS"; }, []);
  useEffect(() => {
    supabase.from("activity_log").select("*")
      .eq("device_id", getDeviceId())
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Row[]));
  }, []);

  const groups: Record<string, Row[]> = {};
  for (const r of items) {
    const k = format(new Date(r.created_at), "MMMM d, yyyy");
    (groups[k] ??= []).push(r);
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <header>
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Every AI suggestion, edit, and approval.</p>
        </header>

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
                      {r.detail && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{r.detail}</p>}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}

function ActionBadge({ action }: { action: string }) {
  if (action === "approved") return <Badge className="bg-success/20 text-success border-success/40 hover:bg-success/20">approved</Badge>;
  if (action === "ignored") return <Badge variant="secondary">ignored</Badge>;
  return <Badge variant="outline">{action}</Badge>;
}
