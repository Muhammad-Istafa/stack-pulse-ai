import { useState } from "react";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { toast } from "@/hooks/use-toast";

type Props = {
  className?: string;
  label?: string;
};

export default function GoogleSignInButton({ className, label = "Continue with Google" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      setLoading(false);
      toast({
        title: "Sign-in failed",
        description: result.error.message ?? "Unable to start Google sign-in.",
        variant: "destructive",
      });
      return;
    }
    // If redirected, browser will navigate away — leave loading state on.
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center justify-center gap-3 font-display font-light text-[10px] tracking-[0.4em] uppercase text-primary border border-primary/40 px-12 py-5 hover:bg-primary/10 hover:text-primary-glow hover:border-primary transition-all disabled:opacity-60"
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.3 2.4-5.3 0-9.7-3.4-11.3-8L6 32.6C9.3 39 16 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C41 36.2 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
        </svg>
      )}
      {label}
    </button>
  );
}
