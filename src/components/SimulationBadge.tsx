import { FlaskConical, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMode } from "@/lib/mode";

export default function SimulationBadge({ compact = false }: { compact?: boolean }) {
  const { connection } = useMode();
  if (connection.connected) {
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/40 text-[10px] uppercase tracking-wider gap-1">
        <CheckCircle2 className="h-2.5 w-2.5" />
        {compact ? "Live" : `Connected · ${connection.email}`}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/40 text-[10px] uppercase tracking-wider gap-1">
      <FlaskConical className="h-2.5 w-2.5" />
      Simulation mode
    </Badge>
  );
}
