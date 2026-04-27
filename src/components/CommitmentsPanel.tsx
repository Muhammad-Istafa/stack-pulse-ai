import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, ListChecks, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { logActivity } from "@/lib/activity";
import { format, formatDistanceToNow, isPast, differenceInHours } from "date-fns";

export type Commitment = {
  id: string;
  task: string;
  owner: string;
  source_quote: string | null;
  deadline: string | null;
  status: string;
  email_id: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-muted text-foreground border-border",
  done: "bg-success/15 text-success border-success/40",
  at_risk: "bg-destructive/15 text-destructive border-destructive/40",
};

export function deriveStatus(c: Commitment): string {
  if (c.status === "done") return "done";
  if (c.deadline) {
    const d = new Date(c.deadline);
    if (isPast(d)) return "at_risk";
    if (differenceInHours(d, new Date()) <= 24) return "at_risk";
  }
  return "pending";
}

export default function CommitmentsPanel({ refreshKey, filterEmailId }: { refreshKey?: number; filterEmailId?: string | null }) {
  const [items, setItems] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"all" | "pending" | "at_risk" | "done">("all");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("commitments")
      .select("*")
      .eq("device_id", getDeviceId())
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Commitment[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function setStatus(c: Commitment, status: "done" | "pending") {
    await supabase.from("commitments").update({ status }).eq("id", c.id);
    if (status === "done") await logActivity("ops", "approved", `Commitment closed: ${c.task}`);
    load();
  }
  async function remove(c: Commitment) {
    await supabase.from("commitments").delete().eq("id", c.id);
    load();
  }

  const enriched = items
    .map(c => ({ ...c, derived: deriveStatus(c) }))
    .filter(c => filterEmailId ? c.email_id === filterEmailId : true)
    .filter(c => tab === "all" ? true : c.derived === tab);

  const counts = {
    all: items.length,
    pending: items.filter(c => deriveStatus(c) === "pending").length,
    at_risk: items.filter(c => deriveStatus(c) === "at_risk").length,
    done: items.filter(c => deriveStatus(c) === "done").length,
  };

  return (
    <Card className="shadow-card overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Commitments</span>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <span className="ml-auto text-[10px] text-muted-foreground">{counts.all} tracked</span>
      </div>
      <div className="px-3 pt-2 pb-1 flex gap-1 border-b border-border">
        {(["all", "pending", "at_risk", "done"] as const).map(k => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${
              tab === k ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {k.replace("_", " ")} {counts[k] > 0 && <span className="opacity-60">({counts[k]})</span>}
          </button>
        ))}
      </div>
      <ScrollArea className="flex-1">
        {enriched.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No commitments yet. Open an email — the agent will extract any promises or deadlines.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {enriched.map(c => (
              <li key={c.id} className="p-3 hover:bg-muted/30 transition-colors group">
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => setStatus(c, c.status === "done" ? "pending" : "done")}
                    className={`mt-0.5 h-4 w-4 rounded border ${
                      c.status === "done"
                        ? "bg-success border-success text-success-foreground"
                        : "border-muted-foreground/40 hover:border-primary"
                    } flex items-center justify-center shrink-0`}
                    aria-label="toggle done"
                  >
                    {c.status === "done" && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium leading-snug ${c.status === "done" ? "line-through text-muted-foreground" : ""}`}>{c.task}</div>
                    {c.source_quote && (
                      <div className="text-[11px] text-muted-foreground mt-1 italic line-clamp-2">"{c.source_quote}"</div>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge variant="outline" className={`text-[9px] uppercase ${STATUS_STYLE[c.derived as string] ?? ""}`}>
                        {c.derived === "at_risk" ? <AlertTriangle className="h-2.5 w-2.5 mr-1" /> : c.derived === "done" ? <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> : <Clock className="h-2.5 w-2.5 mr-1" />}
                        {c.derived.replace("_", " ")}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] uppercase">{c.owner === "founder" ? "you owe" : "they owe"}</Badge>
                      {c.deadline && (
                        <span className={`text-[10px] ${c.derived === "at_risk" ? "text-destructive" : "text-muted-foreground"}`}>
                          due {format(new Date(c.deadline), "MMM d, h:mm a")} · {formatDistanceToNow(new Date(c.deadline), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => remove(c)}
                    aria-label="remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </Card>
  );
}
