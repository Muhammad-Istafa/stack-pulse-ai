import { CheckCircle2, Loader2, AlertCircle, Circle, ArrowRight, Mail, Database, FileText, Sparkles, Calendar as CalIcon, FileSpreadsheet } from "lucide-react";

export type WorkflowStep = {
  name: string;
  tool: string;
  description?: string;
  status?: "pending" | "running" | "done" | "error";
  output?: string | null;
  error?: string | null;
};

const TOOL_ICON: Record<string, any> = {
  google_sheets: FileSpreadsheet,
  notion: FileText,
  calendar: CalIcon,
  gmail: Mail,
  stripe: Database,
  hubspot: Database,
  format: Sparkles,
  ai_draft: Sparkles,
};

const TOOL_LABEL: Record<string, string> = {
  google_sheets: "Google Sheets",
  notion: "Notion",
  calendar: "Calendar",
  gmail: "Gmail",
  stripe: "Stripe",
  hubspot: "HubSpot",
  format: "Format",
  ai_draft: "AI Draft",
};

function StatusIcon({ status }: { status?: string }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "running") return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
  if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

export function WorkflowDiagram({ steps }: { steps: WorkflowStep[] }) {
  if (!steps?.length) return null;
  return (
    <div className="overflow-x-auto">
      <div className="flex items-stretch gap-2 min-w-max py-2">
        {steps.map((s, i) => {
          const Icon = TOOL_ICON[s.tool] ?? Sparkles;
          const ring =
            s.status === "done" ? "border-success/40 bg-success/5"
            : s.status === "running" ? "border-primary/50 bg-primary/5 shadow-glow"
            : s.status === "error" ? "border-destructive/50 bg-destructive/10"
            : "border-border bg-card";
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`min-w-[180px] max-w-[220px] rounded-lg border ${ring} p-3 transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {TOOL_LABEL[s.tool] ?? s.tool}
                  </div>
                  <StatusIcon status={s.status} />
                </div>
                <div className="text-sm font-medium leading-snug">{s.name}</div>
                {s.error && <div className="mt-2 text-[11px] text-destructive">{s.error}</div>}
                {s.output && s.status === "done" && (
                  <div className="mt-2 text-[11px] text-muted-foreground line-clamp-3 whitespace-pre-wrap">{s.output}</div>
                )}
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
