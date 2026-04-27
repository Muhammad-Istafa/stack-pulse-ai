import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const STORAGE_KEY = "founderos.connection";

export type Connection = {
  connected: boolean;
  email?: string;
  name?: string;
  connectedAt?: string;
  scopes?: string[];
};

type Ctx = {
  connection: Connection;
  connect: (data: { email: string; name?: string; scopes?: string[] }) => void;
  disconnect: () => void;
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
