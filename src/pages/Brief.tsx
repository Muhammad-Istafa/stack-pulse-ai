import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Cpu, AlertTriangle, CheckCircle2, ArrowRight, Mail, FlaskConical, Calendar as CalIcon, TrendingDown, Sparkles, Inbox } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { seedIfEmpty } from "@/lib/seed";
import RiskMeter from "@/components/RiskMeter";
import TimeSavedCard from "@/components/TimeSavedCard";
import OverviewPanel from "@/components/OverviewPanel";
import SimulationBadge from "@/components/SimulationBadge";
import { format, formatDistanceToNow } from "date-fns";

type ActivityRow = { id: string; agent: string; action: string; title: string; detail: string | null; created_at: string };
type EmailRow = { id: string; sender_name: string; subject: string; category: string; status: string; detected_intent: string | null; received_at: string };
type FeedRow = { id: string; title: string; vendor: string; relevance_score: number | null; potential_savings_pct: number | null; status: string };
type CalEvent = { id: string; title: string; detail: string | null; scheduled_for: string; status: string };

export default function Brief() {
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [actionEmails, setActionEmails] = useState<EmailRow[]>([]);
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);

  useEffect(() => { document.title = "Daily Brief · Stack Pulse"; }, []);

  useEffect(() => {
    (async () => {
      const seed = await seedIfEmpty();
      if (!seed.ok) console.error("Seed failed:", seed.error);
      const did = getDeviceId();
      const [a, e, f, c] = await Promise.all([
        supabase.from("activity_log").select("*").eq("device_id", did).order("created_at", { ascending: false }).limit(6),
        supabase.from("emails").select("*").eq("device_id", did).in("status", ["unread", "read"]).neq("category", "cold").order("received_at", { ascending: false }).limit(5),
        supabase.from("tech_feed").select("*").eq("device_id", did).order("relevance_score", { ascending: false }).limit(4),
        supabase.from("calendar_events").select("*").eq("device_id", did).order("scheduled_for", { ascending: true }).limit(5),
      ]);
      setActivity((a.data ?? []) as ActivityRow[]);
      setActionEmails((e.data ?? []) as EmailRow[]);
      setFeed((f.data ?? []) as FeedRow[]);
      setEvents((c.data ?? []) as CalEvent[]);
    })();
  }, []);

  const today = new Date();
  const totalSavings = feed.reduce((s, f) => s + (f.potential_savings_pct ?? 0), 0);

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{format(today, "EEEE, MMMM d")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Today's Critical Actions</h1>
            <p className="text-sm text-muted-foreground mt-1">{actionEmails.length} pending tasks · {feed.filter(f => (f.relevance_score ?? 0) >= 70).length} high-relevance tech opportunities</p>
          </div>
          <SimulationBadge />
        </header>

        {/* Unified AI overview */}
        <OverviewPanel />

        {/* Risk + Time Saved */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><RiskMeter /></div>
          <div className="lg:col-span-1"><TimeSavedCard /></div>
        </section>

        {/* Critical actions */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Pending replies</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {actionEmails.slice(0, 3).map(e => (
              <Link to="/ops" key={e.id}>
                <Card className="p-4 bg-priority border-warning/30 shadow-card hover:shadow-glow transition-all h-full">
                  <div className="text-xs text-muted-foreground">{e.sender_name}</div>
                  <div className="font-medium mt-1 line-clamp-1">{e.subject}</div>
                  {e.detected_intent && <div className="text-xs text-muted-foreground mt-2 line-clamp-2"><Sparkles className="h-3 w-3 inline text-primary mr-1" />{e.detected_intent}</div>}
                  <Badge className="mt-2 bg-warning/20 text-warning border-warning/40 hover:bg-warning/20 text-[10px]">{formatDistanceToNow(new Date(e.received_at), { addSuffix: true })}</Badge>
                </Card>
              </Link>
            ))}
            {actionEmails.length === 0 && (
              <Card className="p-4 shadow-card md:col-span-3 text-sm text-muted-foreground"><Inbox className="h-4 w-4 inline mr-2" /> Inbox zero. Open Ops to seed mock emails.</Card>
            )}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Ops summary */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Ops · Paul</h2>
              </div>
              <Link to="/ops" className="text-xs text-primary flex items-center gap-1">Open Ops <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <Card className="p-5 shadow-card space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Pending" value={actionEmails.length.toString()} />
                <Stat label="Done today" value={activity.filter(a => a.agent === "ops" && a.action === "approved").length.toString()} accent="success" />
                <Stat label="MRR" value="$48.2k" accent="success" sub="+18% WoW" />
              </div>
              <ul className="pt-2 border-t border-border space-y-2">
                {actionEmails.slice(0, 3).map(e => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="line-clamp-1"><Mail className="h-3 w-3 inline text-muted-foreground mr-1.5" />{e.detected_intent ?? e.subject}</span>
                    <Link to="/ops" className="text-xs text-primary shrink-0">Draft →</Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Tech summary */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Tech · Sam</h2>
              </div>
              <Link to="/tech" className="text-xs text-primary flex items-center gap-1">Open Tech <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <Card className="p-5 shadow-card space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="New tools" value={feed.filter(f => f.status === "new").length.toString()} />
                <Stat label="Tested" value={activity.filter(a => a.agent === "tech" && a.title.includes("sandbox")).length.toString()} />
                <Stat label="Savings opp." value={totalSavings ? `~${totalSavings}%` : "—"} accent="success" sub="combined" />
              </div>
              <ul className="pt-2 border-t border-border space-y-2">
                {feed.slice(0, 3).map(f => (
                  <li key={f.id} className="flex items-center justify-between text-sm">
                    <span className="line-clamp-1"><FlaskConical className="h-3 w-3 inline text-muted-foreground mr-1.5" />{f.title}</span>
                    <span className="text-xs text-success shrink-0 flex items-center gap-1">{f.potential_savings_pct ? <><TrendingDown className="h-3 w-3" /> −{f.potential_savings_pct}%</> : <Sparkles className="h-3 w-3" />}</span>
                  </li>
                ))}
                {feed.length === 0 && <li className="text-xs text-muted-foreground">No feed yet — open Tech to scan sources.</li>}
              </ul>
            </Card>
          </section>
        </div>

        {/* Calendar */}
        {events.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CalIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Calendar suggestions</h2>
            </div>
            <Card className="p-4 shadow-card">
              <ul className="divide-y divide-border">
                {events.map(ev => (
                  <li key={ev.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{ev.title}</div>
                      {ev.detail && <div className="text-xs text-muted-foreground line-clamp-1">{ev.detail}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{format(new Date(ev.scheduled_for), "EEE MMM d, h:mm a")}</div>
                      <Badge variant="secondary" className="text-[9px] mt-1">{ev.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {/* Recent activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Recent activity</h2>
            </div>
            <Link to="/activity" className="text-xs text-primary flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <Card className="p-4 shadow-card">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions yet — generate something with Ops or Tech to see it here.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map(a => (
                  <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary" className="uppercase text-[10px]">{a.agent}</Badge>
                      <span className="line-clamp-1">{a.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{a.action} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
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

function Stat({ label, value, accent, sub }: { label: string; value: string; accent?: "success"; sub?: string }) {
  return (
    <div className="rounded border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold mt-0.5 ${accent === "success" ? "text-success" : ""}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
