import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [fetching, setFetching] = useState(false);
  const [weekly, setWeekly] = useState(true);

  useEffect(() => { document.title = "Settings · Stack Sentinel"; }, []);

  const fetchUpdates = async () => {
    if (!user) return;
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-updates", { body: {} });
      if (error) throw error;
      toast.success(`Saved ${data?.saved ?? 0} new updates`);
    } catch (e: any) {
      toast.error(e.message ?? "Fetch failed");
    } finally {
      setFetching(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage scans and notifications.</p>
        </div>

        <Card className="p-5 shadow-card space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 grid place-items-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">AI intelligence engine</h3>
              <p className="text-sm text-muted-foreground">Powered by Lovable AI — no API key needed. Scans GitHub releases and Hacker News, then ranks relevance to your stack.</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Manual refresh</h3>
              <p className="text-sm text-muted-foreground">Run a fresh scan across your stack right now.</p>
            </div>
            <Button onClick={fetchUpdates} disabled={fetching} className="gap-1 bg-primary-gradient shadow-glow">
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
              {fetching ? "Scanning…" : "Fetch Latest Updates"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly" className="font-medium">Weekly digest email</Label>
              <p className="text-sm text-muted-foreground">Get a summary in your inbox every Monday.</p>
            </div>
            <Switch id="weekly" checked={weekly} onCheckedChange={setWeekly} />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
