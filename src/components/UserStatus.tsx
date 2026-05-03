import { useEffect, useState } from "react";
import { LogOut, Loader2, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

type Status = "loading" | "in" | "out";

export default function UserStatus() {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setStatus(s ? "in" : "out");
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? "in" : "out");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) toast.error(error.message);
    else toast.success("Signed out");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-card/40 px-2.5 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verifying session…
      </div>
    );
  }

  if (status === "out") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-card/40 px-2.5 py-2 text-xs text-muted-foreground">
        <UserRound className="h-3.5 w-3.5" />
        Not signed in
      </div>
    );
  }

  const user = session?.user;
  const email = user?.email ?? "Signed in";
  const name = (user?.user_metadata?.full_name as string | undefined) ?? null;

  return (
    <div className="rounded-md border border-border bg-card/40 px-2.5 py-2 space-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <UserRound className="h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0 leading-tight">
          {name && <div className="text-xs font-medium truncate">{name}</div>}
          <div className="text-[11px] text-muted-foreground truncate">{email}</div>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="w-full justify-start h-7 text-xs"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
        Sign out
      </Button>
    </div>
  );
}
