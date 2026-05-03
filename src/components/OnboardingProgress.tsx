import { useMemo } from "react";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useMode } from "@/lib/mode";

export default function OnboardingProgress() {
  const { connection, integrations } = useMode();

  const steps = useMemo(() => {
    const connectedPlatforms = Object.values(integrations).filter((i) => i.connected).length;
    return [
      { label: "Sign in with Google", done: connection.connected },
      { label: "Connect first integration", done: connectedPlatforms >= 1 },
      { label: "Build your stack (3+)", done: connectedPlatforms >= 3 },
    ];
  }, [connection.connected, integrations]);

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);

  // Hide once fully onboarded
  if (completed === total) return null;

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2.5 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
        <Sparkles className="h-3 w-3" />
        Setup · {completed}/{total}
      </div>
      <div className="h-1 rounded-full bg-primary/15 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-1 pt-0.5">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-[11px]">
            {s.done ? (
              <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={s.done ? "text-muted-foreground line-through" : "text-foreground/80"}>
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
