import { useEffect, useState } from "react";
import { Clock4, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";

// Rough manual-time estimates per action (in minutes)
const WEIGHTS: Record<string, number> = {
  ops_approved: 22,        // drafting + sending an email manually
  ops_generated: 8,        // workflow design + extraction
  tech_approved: 35,       // tech decision + plan write-up
  tech_generated: 12,      // research + sandbox setup
};

export default function TimeSavedCard() {
  const [today, setToday] = useState(0);
  const [week, setWeek] = useState(0);
  const [counts, setCounts] = useState({ ops: 0, tech: 0 });

  useEffect(() => {
    (async () => {
      const did = getDeviceId();
      const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
      const startWeek = new Date(); startWeek.setDate(startWeek.getDate() - 7);

      const { data } = await supabase
        .from("activity_log")
        .select("agent, action, created_at")
        .eq("device_id", did)
        .gte("created_at", startWeek.toISOString());

      let mt = 0, mw = 0, ops = 0, tech = 0;
      (data ?? []).forEach((a: any) => {
        const key = `${a.agent}_${a.action}`;
        const min = WEIGHTS[key] ?? 0;
        mw += min;
        if (new Date(a.created_at) >= startToday) mt += min;
        if (a.agent === "ops") ops++; else if (a.agent === "tech") tech++;
      });
      setToday(mt); setWeek(mw); setCounts({ ops, tech });
    })();
  }, []);

  const fmt = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h}h ${rest}m` : `${h}h`;
  };

  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Clock4 className="h-4 w-4 text-primary" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Time saved</span>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-semibold tracking-tight">{fmt(today)}</div>
        <div className="text-xs text-muted-foreground">today</div>
        <div className="ml-auto inline-flex items-center gap-1 text-xs text-success">
          <TrendingUp className="h-3 w-3" /> {fmt(week)} this week
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-success transition-all duration-700"
          style={{ width: `${Math.min(100, (today / 240) * 100)}%` }}
        />
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        {counts.ops} Ops · {counts.tech} Tech actions handled by agents
      </div>
    </Card>
  );
}
