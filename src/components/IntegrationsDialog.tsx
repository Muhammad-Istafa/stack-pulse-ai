import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plug, X } from "lucide-react";
import { useMode, type PlatformId } from "@/lib/mode";
import { toast } from "sonner";

type Platform = {
  id: PlatformId;
  name: string;
  category: string;
  description: string;
  accountLabel: string;
  accountPlaceholder: string;
  accent: string; // tailwind text color class
};

const PLATFORMS: Platform[] = [
  { id: "vercel", name: "Vercel", category: "Hosting", description: "Deployments, build status, env vars", accountLabel: "Team or project", accountPlaceholder: "acme-inc", accent: "text-foreground" },
  { id: "github", name: "GitHub", category: "Code", description: "PRs, issues, releases, CI signals", accountLabel: "Org / username", accountPlaceholder: "acme", accent: "text-foreground" },
  { id: "stripe", name: "Stripe", category: "Payments", description: "MRR, churn, failed payments", accountLabel: "Account email", accountPlaceholder: "billing@acme.com", accent: "text-primary" },
  { id: "notion", name: "Notion", category: "Docs", description: "Investor updates, specs, OKRs", accountLabel: "Workspace", accountPlaceholder: "Acme HQ", accent: "text-foreground" },
  { id: "linear", name: "Linear", category: "Project mgmt", description: "Issues, cycles, engineering velocity", accountLabel: "Workspace", accountPlaceholder: "acme", accent: "text-primary" },
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Deals, contacts, pipeline stage", accountLabel: "Portal ID / email", accountPlaceholder: "ops@acme.com", accent: "text-warning" },
  { id: "slack", name: "Slack", category: "Comms", description: "Send drafts, alerts to channels", accountLabel: "Workspace", accountPlaceholder: "acme.slack.com", accent: "text-primary" },
  { id: "google_sheets", name: "Google Sheets", category: "Data", description: "MRR trackers, custom dashboards", accountLabel: "Account email", accountPlaceholder: "you@acme.com", accent: "text-success" },
  { id: "perplexity", name: "Perplexity", category: "Research", description: "Live web research for Tech agent", accountLabel: "Account email", accountPlaceholder: "you@acme.com", accent: "text-foreground" },
  { id: "supabase", name: "Supabase", category: "Backend", description: "DB metrics, auth events, edge logs", accountLabel: "Project ref", accountPlaceholder: "abcd1234", accent: "text-success" },
];

export default function IntegrationsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { integrations, connectPlatform, disconnectPlatform } = useMode();
  const [active, setActive] = useState<PlatformId | null>(null);
  const [account, setAccount] = useState("");

  const activeP = PLATFORMS.find(p => p.id === active);

  function handleConnect() {
    if (!activeP) return;
    const value = account.trim() || `demo@${activeP.id}.local`;
    connectPlatform(activeP.id, value);
    toast.success(`${activeP.name} connected`, { description: "Demo mode — using mock data." });
    setActive(null);
    setAccount("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Integrations</DialogTitle>
          <DialogDescription>
            Connect platforms Stack Pulse uses across Ops and Tech workflows. Demo mode — no live OAuth.
          </DialogDescription>
        </DialogHeader>

        {!activeP ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-auto pr-1">
            {PLATFORMS.map(p => {
              const state = integrations[p.id];
              return (
                <div key={p.id} className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-md bg-muted grid place-items-center text-xs font-bold ${p.accent}`}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{p.category}</span>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>
                    {state.connected && (
                      <div className="mt-1 text-[10px] text-success flex items-center gap-1">
                        <Check className="h-3 w-3" /> {state.account}
                      </div>
                    )}
                    <div className="mt-2 flex gap-1.5">
                      {state.connected ? (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setActive(p.id); setAccount(state.account ?? ""); }}>
                            Manage
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => { disconnectPlatform(p.id); toast(`${p.name} disconnected`); }}>
                            <X className="h-3 w-3" /> Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setActive(p.id); setAccount(""); }}>
                          <Plug className="h-3 w-3" /> Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-sm font-medium">{activeP.name}</div>
              <div className="text-xs text-muted-foreground">{activeP.description}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{activeP.accountLabel}</label>
              <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder={activeP.accountPlaceholder} />
              <p className="text-[10px] text-muted-foreground">
                Demo mode — no OAuth runs. Stack Pulse treats this platform as connected and uses mock data.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setActive(null)}>Back</Button>
              <Button onClick={handleConnect}>
                <Plug className="h-3.5 w-3.5" /> Connect {activeP.name}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
