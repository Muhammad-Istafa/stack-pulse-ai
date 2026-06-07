import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SimulationBadge({ compact = false }: { compact?: boolean }) {
  return (
    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/40 text-[10px] uppercase tracking-wider gap-1">
      <FlaskConical className="h-2.5 w-2.5" />
      {compact ? "Simulation" : "Simulation mode"}
    </Badge>
  );
}
