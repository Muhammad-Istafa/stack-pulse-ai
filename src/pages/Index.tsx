import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Zap, TrendingUp, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary-gradient grid place-items-center shadow-glow">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Stack Sentinel</span>
          </div>
          <Link to="/auth"><Button size="sm">Sign in</Button></Link>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground mb-6">
            <Zap className="h-3 w-3 text-primary" /> AI-curated · weekly intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Tech intelligence for<br />
            <span className="bg-primary-gradient bg-clip-text text-transparent">technical co-founders</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Stack Sentinel watches your tech stack 24/7 and surfaces only the updates that matter — pricing changes, security alerts, and cost-saving alternatives.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="bg-primary-gradient shadow-glow">Get started free</Button></Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-4">
          {[
            { icon: Bell, title: "Priority alerts", body: "AI flags the 2 most urgent updates each week." },
            { icon: TrendingUp, title: "Cost impact", body: "Know whether changes save or cost you money." },
            { icon: Shield, title: "Your stack only", body: "Filter the noise. Only signals that touch your tools." },
          ].map((f) => (
            <div key={f.title} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
