import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Layers, History, Settings, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stack", label: "My Stack", icon: Layers },
  { to: "/history", label: "Digest History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const deviceId = getDeviceId();
    (async () => {
      const { count } = await supabase
        .from("stack_tools")
        .select("id", { count: "exact", head: true })
        .eq("user_id", deviceId);
      if ((count ?? 0) === 0 && location.pathname !== "/onboarding") {
        navigate("/onboarding", { replace: true });
      } else {
        setChecked(true);
      }
    })();
  }, [navigate, location.pathname]);

  if (!checked) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-56 border-r border-border bg-sidebar flex flex-col">
        <Link to="/dashboard" className="h-14 px-4 flex items-center gap-2 border-b border-sidebar-border">
          <div className="h-7 w-7 rounded-md bg-primary-gradient grid place-items-center shadow-glow">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Stack Sentinel</span>
        </Link>
        <nav className="p-2 space-y-1 flex-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "bg-sidebar-accent text-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
