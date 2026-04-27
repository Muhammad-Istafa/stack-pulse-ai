import { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Cpu, Activity, Sparkles } from "lucide-react";

const NAV = [
  { to: "/brief", label: "Daily Brief", icon: LayoutDashboard },
  { to: "/ops", label: "Ops Agent", icon: Briefcase },
  { to: "/tech", label: "Tech Agent", icon: Cpu },
  { to: "/activity", label: "Activity Log", icon: Activity },
];

export default function AppLayout({ children }: { children: ReactNode }) {
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
        <div className="p-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
          AI never auto-executes. You always approve.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
