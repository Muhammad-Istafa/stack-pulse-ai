import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Cpu, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";

type ActivityRow = { id: string; agent: string; action: string; title: string; created_at: string };

const MISSED = [
  { who: "Acme Ventures", what: "Reply to Sarah re: term sheet", days: 3 },
  { who: "TechCrunch", what: "Send press kit", days: 5 },
  { who: "Customer: Linear", what: "Quarterly check-in call", days: 2 },
];

const PENDING = [
  { title: "Draft monthly investor update", agent: "ops" as const },
  { title: "Decide on auth provider migration", agent: "tech" as const },
  { title: "Reply to Y Combinator partner", agent: "ops" as const },
];

const TECH_RECS = [
  { title: "Switch LLM router to Gemini Flash", impact: "−32% inference cost" },
  { title: "Move queue worker to fly.io machines", impact: "−40% p95 latency" },
];

export default function Brief() {
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => { document.title = "Daily Brief · FounderOS"; }, []);
  useEffect(() => {
    supabase.from("activity_log").select("id, agent, action, title, created_at")
      .eq("device_id", getDeviceId())
      .order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setActivity((data ?? []) as ActivityRow[]));
  }, []);

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today's Critical Actions</h1>
          <p className="text-sm text-muted-foreground mt-1">Three things matter right now. Everything else can wait.</p>
        </header>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Missed follow-ups</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {MISSED.map((m) => (
              <Card key={m.what} className="p-4 bg-priority border-warning/30 shadow-card">
                <div className="text-xs text-muted-foreground">{m.who}</div>
                <div className="font-medium mt-1">{m.what}</div>
                <Badge className="mt-2 bg-warning/20 text-warning border-warning/40 hover:bg-warning/20">{m.days}d overdue</Badge>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Ops summary</h2>
              </div>
              <Link to="/ops" className="text-xs text-primary flex items-center gap-1">Open Ops <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <Card className="p-5 shadow-card">
              <p className="text-sm text-muted-foreground">3 pending comms · MRR up <span className="text-success">+18%</span> WoW · 2 investor pings unanswered</p>
              <ul className="mt-4 space-y-2">
                {PENDING.filter(p => p.agent === "ops").map((p) => (
                  <li key={p.title} className="flex items-center justify-between text-sm border-t border-border pt-2 first:border-0 first:pt-0">
                    <span>{p.title}</span>
                    <Link to="/ops" className="text-xs text-primary">Draft →</Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Tech summary</h2>
              </div>
              <Link to="/tech" className="text-xs text-primary flex items-center gap-1">Open Tech <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <Card className="p-5 shadow-card">
              <p className="text-sm text-muted-foreground">2 recommendations awaiting review · estimated savings <span className="text-success">$1.2k/mo</span></p>
              <ul className="mt-4 space-y-2">
                {TECH_RECS.map((r) => (
                  <li key={r.title} className="flex items-center justify-between text-sm border-t border-border pt-2 first:border-0 first:pt-0">
                    <span>{r.title}</span>
                    <span className="text-xs text-success">{r.impact}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Recent activity</h2>
          </div>
          <Card className="p-4 shadow-card">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions yet — generate something with Ops or Tech to see it here.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((a) => (
                  <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="uppercase text-[10px]">{a.agent}</Badge>
                      <span>{a.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.action}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
