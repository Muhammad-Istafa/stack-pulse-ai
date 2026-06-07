import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, Shield, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { isPast, differenceInHours } from "date-fns";

type Signals = {
  overdue_commitments: number;
  near_deadline: number;
  pending_action_emails: number;
  failed_workflows: number;
  done_today: number;
};

function computeScore(s: Signals): number {
  // 0 (safe) → 100 (critical). Capped.
  const raw =
    s.overdue_commitments * 18 +
    s.near_deadline * 8 +
    s.pending_action_emails * 6 +
    s.failed_workflows * 12 -
    s.done_today * 4;
  return Math.max(0, Math.min(100, raw));
}

function level(score: number): { label: "Low" | "Medium" | "High"; color: string; ring: string; Icon: any } {
  if (score >= 65) return { label: "High", color: "text-destructive", ring: "stroke-destructive", Icon: ShieldAlert };
  if (score >= 30) return { label: "Medium", color: "text-warning", ring: "stroke-warning", Icon: Shield };
  return { label: "Low", color: "text-success", ring: "stroke-success", Icon: ShieldCheck };
}

export default function RiskMeter() {
  const [signals, setSignals] = useState<Signals | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExp, setLoadingExp] = useState(false);

  async function load() {
    const did = getDeviceId();
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const [comms, emails, wfs, acts] = await Promise.all([
      supabase.from("commitments").select("status, deadline").eq("device_id", did).neq("status", "done"),
      supabase.from("emails").select("id").eq("device_id", did).eq("category", "action_required").in("status", ["unread", "read"]),
      supabase.from("workflows").select("id").eq("device_id", did).eq("status", "error"),
      supabase.from("activity_log").select("id").eq("device_id", did).eq("agent", "ops").eq("action", "approved").gte("created_at", startOfDay.toISOString()),
    ]);

    const now = new Date();
    let overdue = 0, near = 0;
    (comms.data ?? []).forEach((c: any) => {
      if (!c.deadline) return;
      const d = new Date(c.deadline);
      if (isPast(d)) overdue++;
      else if (differenceInHours(d, now) <= 24) near++;
    });

    const s: Signals = {
      overdue_commitments: overdue,
      near_deadline: near,
      pending_action_emails: emails.data?.length ?? 0,
      failed_workflows: wfs.data?.length ?? 0,
      done_today: acts.data?.length ?? 0,
    };
    setSignals(s);

    // Ask AI for the explanation (cheap, one-line)
    const score = computeScore(s);
    setLoadingExp(true);
    try {
      const { data } = await supabase.functions.invoke("ops-agent", {
        body: { action: "explain_risk", device_id: getDeviceId(), score, signals: s },
      });
      setExplanation(data?.explanation ?? "");
    } catch {
      setExplanation(score >= 65 ? "Several commitments are overdue. Clear at least one before EOD."
        : score >= 30 ? "Risk is manageable. A few items need attention soon."
        : "All clear. No critical signals detected.");
    } finally {
      setLoadingExp(false);
    }
  }

  useEffect(() => { load(); }, []);

  const score = signals ? computeScore(signals) : 0;
  const lv = level(score);
  const Icon = lv.Icon;
  const dash = (score / 100) * 264; // circumference for r=42

  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${lv.color}`} />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Startup Risk Score</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" className="stroke-muted" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              className={`${lv.ring} transition-all duration-700`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} 264`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-2xl font-semibold ${lv.color}`}>{score}</div>
            <div className={`text-[10px] uppercase tracking-wider ${lv.color}`}>{lv.label}</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm leading-relaxed flex items-start gap-1.5">
            {loadingExp ? (
              <span className="text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Analyzing signals…</span>
            ) : (
              <><Sparkles className="h-3 w-3 text-primary mt-1 shrink-0" /><span>{explanation}</span></>
            )}
          </div>
          {signals && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>Overdue commitments</span><span className="text-right text-foreground">{signals.overdue_commitments}</span>
              <span>Due &lt;24h</span><span className="text-right text-foreground">{signals.near_deadline}</span>
              <span>Pending action emails</span><span className="text-right text-foreground">{signals.pending_action_emails}</span>
              <span>Failed workflows</span><span className="text-right text-foreground">{signals.failed_workflows}</span>
              <span>Approved today</span><span className="text-right text-success">+{signals.done_today}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
