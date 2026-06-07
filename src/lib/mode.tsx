import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const INTEGRATIONS_KEY = "founderos.integrations";

export type PlatformId =
  | "vercel" | "notion" | "stripe" | "github" | "linear"
  | "hubspot" | "slack" | "google_sheets" | "perplexity" | "supabase";

export type IntegrationState = {
  connected: boolean;
  account?: string;
  connectedAt?: string;
};

export type Integrations = Record<PlatformId, IntegrationState>;

const DEFAULT_INTEGRATIONS: Integrations = {
  vercel: { connected: false },
  notion: { connected: false },
  stripe: { connected: false },
  github: { connected: false },
  linear: { connected: false },
  hubspot: { connected: false },
  slack: { connected: false },
  google_sheets: { connected: false },
  perplexity: { connected: false },
  supabase: { connected: false },
};

type Ctx = {
  integrations: Integrations;
  connectPlatform: (id: PlatformId, account: string) => void;
  disconnectPlatform: (id: PlatformId) => void;
};

const ModeContext = createContext<Ctx | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [integrations, setIntegrations] = useState<Integrations>(DEFAULT_INTEGRATIONS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INTEGRATIONS_KEY);
      if (raw) setIntegrations({ ...DEFAULT_INTEGRATIONS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    // Clear legacy simulated Google connection state.
    try { localStorage.removeItem("founderos.connection"); } catch { /* ignore */ }
  }, []);

  function persistIntegrations(next: Integrations) {
    setIntegrations(next);
    try { localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent("founderos:integrations", { detail: next }));
  }

  function connectPlatform(id: PlatformId, account: string) {
    persistIntegrations({
      ...integrations,
      [id]: { connected: true, account, connectedAt: new Date().toISOString() },
    });
  }

  function disconnectPlatform(id: PlatformId) {
    persistIntegrations({ ...integrations, [id]: { connected: false } });
  }

  return (
    <ModeContext.Provider value={{ integrations, connectPlatform, disconnectPlatform }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used inside ModeProvider");
  return ctx;
}
