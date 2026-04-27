import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, AlertTriangle, CheckCircle2, Clock, ArrowRight, Activity, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { isPast, differenceInHours, formatDistanceToNow } from "date-fns";

type Commitment = { id: string; task: string; deadline: string | null; status: string; owner: string };
type Workflow = { id: string; problem: string; status: string };

/**
 * Unified at-a-glance panel: active commitments, pending approvals, system risk.
 * Lives at the top of /brief.
 */
export default function OverviewPanel() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Workflow[]>([]);
  const [failed, setFailed] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const did = getDeviceId();
      const [c, w, f] = await Promise.all([
        supabase.from("commitments").select("id, task, deadline, status, owner").eq("device_id", did).neq("status", "done"),
        supabase.from("workflows").select("id, problem, status").eq("device_id", did).eq("status", "awaiting_approval"),
        supabase.from("workflows").select("id", { count: "exact", head: true }).eq("device_id", did).eq("status", "error"),
      ]);
      setCommitments((c.data ?? []) as Commitment[]);
      setPendingApprovals((w.data ?? []) as Workflow[]);
      setFailed(f.count ?? 0);
    })();
  }, []);

  const overdue = commitments.filter(c => c.deadline && isPast(new Date(c.deadline)));
  const dueSoon = commitments.filter(c => c.deadline && !isPast(new Date(c.deadline)) && differenceInHours(new Date(c.deadline), new Date()) <= 24);
  const nextDeadline = commitments
    .filter(c => c.deadline && !isPast(new Date(c.deadline)))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];

  const status: { tone: "success" | "warning" | "destructive"; label: string; msg: string } =
    overdue.length > 0 || failed > 0
      ? { tone: "destructive", label: "Needs attention", msg: `${overdue.length} overdue · ${failed} failed workflow${failed === 1 ? "" : "s"}` }
      : dueSoon.length > 0 || pendingApprovals.length > 0
      ? { tone: "warning", label: "Action ready", msg: `${pendingApprovals.length} draft${pendingApprovals.length === 1 ? "" : "s"} awaiting approval · ${dueSoon.length} due <24h` }
      : { tone: "success", label: "On track", msg: "No critical items. System idle." };

  const toneStyle = {
    success: "bg-success/10 text-success border-success/40",
    warning: "bg-warning/10 text-warning border-warning/40",
    destructive: "bg-destructive/10 text-destructive border-destructive/40",
  }[status.tone];

  return (
    <Card className="p-5 shadow-card border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">AI overview</span>
          <Badge variant="outline" className={`ml-2 text-[10px] uppercase tracking-wider ${toneStyle}`}>
            {status.tone === "destructive" ? <ShieldAlert className="h-2.5 w-2.5 mr-1" /> : status.tone === "warning" ? <AlertTriangle className="h-2.5 w-2.5 mr-1" /> : <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
            {status.label}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{status.msg}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Tile
          to="/ops"
          icon={<ListChecks className="h-3.5 w-3.5" />}
          label="Active commitments"
          value={commitments.length}
          accent={overdue.length > 0 ? "destructive" : dueSoon.length > 0 ? "warning" : undefined}
          sub={overdue.length > 0
            ? `${overdue.length} overdue`
            : nextDeadline
            ? `next ${formatDistanceToNow(new Date(nextDeadline.deadline!), { addSuffix: true })}`
            : "no deadlines"}
        />
        <Tile
          to="/ops"
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Pending approvals"
          value={pendingApprovals.length}
          accent={pendingApprovals.length > 0 ? "warning" : undefined}
          sub={pendingApprovals.length > 0 ? "drafts ready to send" : "inbox clear"}
        />
        <Tile
          to="/ops"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="Failed workflows"
          value={failed}
          accent={failed > 0 ? "destructive" : undefined}
          sub={failed > 0 ? "needs review" : "all green"}
        />
      </div>

      {(overdue.length > 0 || pendingApprovals.length > 0) && (
        <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
          {overdue.slice(0, 2).map(c => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <span className="line-clamp-1 text-foreground/90">
                <AlertTriangle className="h-3 w-3 inline text-destructive mr-1" />
                Overdue: {c.task}
              </span>
              <Link to="/ops" className="text-primary shrink-0 flex items-center gap-1">Resolve <ArrowRight className="h-3 w-3" /></Link>
            </div>
          ))}
          {pendingApprovals.slice(0, 2).map(w => (
            <div key={w.id} className="flex items-center justify-between text-xs">
              <span className="line-clamp-1 text-foreground/90">
                <Clock className="h-3 w-3 inline text-warning mr-1" />
                Draft ready: {w.problem}
              </span>
              <Link to="/ops" className="text-primary shrink-0 flex items-center gap-1">Approve <ArrowRight className="h-3 w-3" /></Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Tile({ to, icon, label, value, sub, accent }: {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  accent?: "warning" | "destructive";
}) {
  const accentColor = accent === "destructive" ? "text-destructive" : accent === "warning" ? "text-warning" : "text-foreground";
  return (
    <Link to={to} className="block rounded-lg border border-border bg-background/50 p-3 hover:border-primary/40 hover:bg-background/80 transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-1 ${accentColor}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </Link>
  );
}
