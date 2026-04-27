import { Link } from "react-router-dom";
import { Sparkles, Briefcase, Cpu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    document.title = "FounderOS — your AI co-founder";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 px-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary-gradient grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">FounderOS</span>
        </div>
        <Button asChild size="sm">
          <Link to="/brief">Open app <ArrowRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <span className="text-xs uppercase tracking-[0.2em] text-primary">AI co-founder · not a chatbot</span>
        <h1 className="mt-4 text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          The heavy lifting,<br/>already prepared.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          FounderOS converts messy founder workflows into executable blocks and technical decisions into tested plans.
          Two agents. One approval click. No auto-execution.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/brief">Enter dashboard</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/ops">Try Ops Agent</Link></Button>
        </div>

        <div className="mt-20 grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">Ops Agent · for Paul</h3>
            <p className="mt-1 text-sm text-muted-foreground">Investor replies, customer comms, partnership emails — drafted with real context, ready to send.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <Cpu className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">Tech Agent · for Sam</h3>
            <p className="mt-1 text-sm text-muted-foreground">Recommendation → sandbox test → migration plan. Decisions delivered, not delegated.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
