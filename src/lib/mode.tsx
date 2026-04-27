import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const STORAGE_KEY = "founderos.connection";
const INTEGRATIONS_KEY = "founderos.integrations";

export type Connection = {
  connected: boolean;
  email?: string;
  name?: string;
  connectedAt?: string;
  scopes?: string[];
};

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
  connection: Connection;
  connect: (data: { email: string; name?: string; scopes?: string[] }) => void;
  disconnect: () => void;
  integrations: Integrations;
  connectPlatform: (id: PlatformId, account: string) => void;
  disconnectPlatform: (id: PlatformId) => void;
};

const ModeContext = createContext<Ctx | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<Connection>({ connected: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConnection(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function persist(next: Connection) {
    setConnection(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    // Notify same-tab listeners
    window.dispatchEvent(new CustomEvent("founderos:connection", { detail: next }));
  }

  function connect(data: { email: string; name?: string; scopes?: string[] }) {
    persist({
      connected: true,
      email: data.email,
      name: data.name ?? data.email.split("@")[0],
      scopes: data.scopes ?? ["gmail.readonly", "gmail.send", "calendar.events", "spreadsheets.readonly"],
      connectedAt: new Date().toISOString(),
    });
  }

  function disconnect() {
    persist({ connected: false });
  }

  return (
    <ModeContext.Provider value={{ connection, connect, disconnect }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used inside ModeProvider");
  return ctx;
}
