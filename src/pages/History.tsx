import { useEffect, useState } from "react";
import { format } from "date-fns";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { Card } from "@/components/ui/card";

type Update = { id: string; tool_name: string; title: string; summary: string; created_at: string; urgency_score: number };

export default function History() {
  const [items, setItems] = useState<Update[]>([]);

  useEffect(() => { document.title = "Digest History · Stack Sentinel"; }, []);
  useEffect(() => {
    const deviceId = getDeviceId();
    supabase.from("updates").select("*").eq("user_id", deviceId).order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Update[]) ?? []));
  }, []);

  // group by date
  const groups: Record<string, Update[]> = {};
  for (const u of items) {
    const k = format(new Date(u.created_at), "MMMM d, yyyy");
    (groups[k] ??= []).push(u);
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Digest History</h1>
          <p className="text-sm text-muted-foreground">Every intelligence scan we've run for your stack.</p>
        </div>

        {Object.entries(groups).map(([date, ups]) => (
          <div key={date}>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{date}</h2>
            <div className="space-y-2">
              {ups.map((u) => (
                <Card key={u.id} className="p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">{u.tool_name}</span>
                    <span className="text-xs text-muted-foreground">Urgency {u.urgency_score}/10</span>
                  </div>
                  <h3 className="font-medium">{u.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{u.summary}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <Card className="p-10 shadow-card text-center text-sm text-muted-foreground">
            No digests yet. Trigger one from Settings.
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
