import { ReactNode, useState, lazy, Suspense } from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Cpu, Activity, Calendar as CalendarIcon, FlaskConical, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMode } from "@/lib/mode";
import IntegrationsDialog from "@/components/IntegrationsDialog";

const ObsidianLogo3D = lazy(() => import("@/components/ObsidianLogo3D"));

const NAV = [
  { to: "/brief", label: "Daily Brief", icon: LayoutDashboard },
  { to: "/ops", label: "Ops Agent", icon: Briefcase },
  { to: "/tech", label: "Tech Agent", icon: Cpu },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/activity", label: "Activity Log", icon: Activity },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { integrations } = useMode();
  const [intOpen, setIntOpen] = useState(false);
  const connectedCount = Object.values(integrations).filter(i => i.connected).length;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
        <Link to="/brief" className="h-14 px-4 flex items-center gap-2 border-b border-sidebar-border">
          <Suspense fallback={<div className="h-9 w-9" />}>
            <ObsidianLogo3D size={36} interactive={false} />
          </Suspense>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">Stack Pulse</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI co-founder</div>
          </div>
        </Link>
        <nav className="p-2 space-y-1 flex-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="w-full rounded-md border border-warning/30 bg-warning/5 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-warning">
              <FlaskConical className="h-3 w-3" /> Simulation mode
            </div>
            <div className="text-xs font-medium mt-0.5">Using mock dataset</div>
            <div className="text-[10px] text-muted-foreground">All data is local to this browser</div>
          </div>
          <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => setIntOpen(true)}>
            <Boxes className="h-3.5 w-3.5" /> Integrations
            <span className="ml-auto text-[10px] text-muted-foreground">{connectedCount}/10</span>
          </Button>
        </div>

        <div className="p-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
          AI never auto-executes. You always approve.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <IntegrationsDialog open={intOpen} onOpenChange={setIntOpen} />
    </div>
  );
}
