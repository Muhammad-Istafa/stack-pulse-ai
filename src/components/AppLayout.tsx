import { ReactNode, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Cpu, Activity, Sparkles, Calendar as CalendarIcon, Plug, FlaskConical, Check, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMode } from "@/lib/mode";
import ConnectGoogleDialog from "@/components/ConnectGoogleDialog";
import IntegrationsDialog from "@/components/IntegrationsDialog";

const NAV = [
  { to: "/brief", label: "Daily Brief", icon: LayoutDashboard },
  { to: "/ops", label: "Ops Agent", icon: Briefcase },
  { to: "/tech", label: "Tech Agent", icon: Cpu },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/activity", label: "Activity Log", icon: Activity },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { connection } = useMode();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
        <Link to="/brief" className="h-14 px-4 flex items-center gap-2 border-b border-sidebar-border">
          <div className="h-7 w-7 rounded-md bg-primary-gradient grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">FounderOS</div>
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

        {/* Mode card */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {connection.connected ? (
            <button
              onClick={() => setOpen(true)}
              className="w-full text-left rounded-md border border-success/30 bg-success/10 px-2.5 py-2 hover:bg-success/15 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-success">
                <Check className="h-3 w-3" /> Connected
              </div>
              <div className="text-xs font-medium truncate mt-0.5">{connection.email}</div>
              <div className="text-[10px] text-muted-foreground">Live data · click to manage</div>
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="w-full text-left rounded-md border border-warning/30 bg-warning/5 px-2.5 py-2 hover:bg-warning/10 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-warning">
                <FlaskConical className="h-3 w-3" /> Simulation mode
              </div>
              <div className="text-xs font-medium mt-0.5">Using mock dataset</div>
              <div className="text-[10px] text-muted-foreground">Connect Google for live data</div>
            </button>
          )}
          {!connection.connected && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(true)}>
              <Plug className="h-3.5 w-3.5" /> Connect Google
            </Button>
          )}
        </div>

        <div className="p-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
          AI never auto-executes. You always approve.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <ConnectGoogleDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
