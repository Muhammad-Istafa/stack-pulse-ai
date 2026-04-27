import { useState } from "react";
import { Loader2, Check, Mail, Calendar, Sheet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMode } from "@/lib/mode";
import { logActivity } from "@/lib/activity";
import { toast } from "@/hooks/use-toast";

const SCOPES = [
  { id: "gmail.readonly", label: "Read Gmail messages", icon: Mail },
  { id: "gmail.send", label: "Send Gmail on your behalf", icon: Mail },
  { id: "calendar.events", label: "Manage Google Calendar events", icon: Calendar },
  { id: "spreadsheets.readonly", label: "Read Google Sheets", icon: Sheet },
];

export default function ConnectGoogleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { connection, connect, disconnect } = useMode();
  const [email, setEmail] = useState("paul@founderos.app");
  const [name, setName] = useState("Paul");
  const [picked, setPicked] = useState<string[]>(SCOPES.map(s => s.id));
  const [stage, setStage] = useState<"form" | "connecting" | "done">("form");

  function toggle(id: string) {
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function handleConnect() {
    setStage("connecting");
    await new Promise(r => setTimeout(r, 1100));
    connect({ email, name, scopes: picked });
    setStage("done");
    await logActivity("ops", "approved", `Google account connected · ${email}`, `Scopes: ${picked.join(", ")}`);
    setTimeout(() => {
      onOpenChange(false);
      setStage("form");
      toast({ title: "Connected", description: "FounderOS now operates on live data." });
    }, 600);
  }

  function handleDisconnect() {
    disconnect();
    onOpenChange(false);
    toast({ title: "Disconnected", description: "Switched back to Simulation mode." });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{connection.connected ? "Google account" : "Connect Google account"}</DialogTitle>
          <DialogDescription>
            {connection.connected
              ? "Manage which services FounderOS can access. Disconnect to return to Simulation mode."
              : "Personalize Ops Agent with your real inbox, calendar and sheets. Demo: connection is simulated locally."}
          </DialogDescription>
        </DialogHeader>

        {connection.connected ? (
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3 text-sm">
              <div className="font-medium">{connection.name}</div>
              <div className="text-muted-foreground text-xs">{connection.email}</div>
              {connection.connectedAt && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Connected {new Date(connection.connectedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Active scopes</div>
              {connection.scopes?.map(s => (
                <div key={s} className="text-xs flex items-center gap-2"><Check className="h-3 w-3 text-success" /> {s}</div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
            </DialogFooter>
          </div>
        ) : stage === "connecting" ? (
          <div className="py-10 flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Authorizing with Google…
          </div>
        ) : stage === "done" ? (
          <div className="py-10 flex flex-col items-center gap-3 text-sm">
            <Check className="h-6 w-6 text-success" />
            Connected as <span className="font-medium">{email}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">Google account email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs">Display name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Permissions</Label>
              {SCOPES.map(s => {
                const Icon = s.icon;
                return (
                  <label key={s.id} className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-muted/40">
                    <Checkbox checked={picked.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{s.label}</span>
                  </label>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleConnect} disabled={!email || picked.length === 0}>
                Authorize Google
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
