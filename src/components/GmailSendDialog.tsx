import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Mail, Paperclip, CheckCircle2, X } from "lucide-react";

export type GmailPayload = {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  thread_id: string;
  message_id: string;
  sent_at: string;
  latency_ms: number;
  size_kb: number;
};

type Stage = "compose" | "sending" | "sent";

function parseDraft(draft: string): { subject: string; body: string } {
  const m = draft.match(/^\s*Subject:\s*(.+)\s*\n([\s\S]*)$/i);
  if (m) return { subject: m[1].trim(), body: m[2].replace(/^\s*\n/, "") };
  const firstLine = draft.split("\n")[0]?.slice(0, 80) ?? "Follow-up";
  return { subject: firstLine, body: draft };
}

function randomId(len = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function GmailSendDialog({
  open,
  onOpenChange,
  draft,
  defaultTo,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: string;
  defaultTo: string;
  onSent: (payload: GmailPayload) => void | Promise<void>;
}) {
  const parsed = useMemo(() => parseDraft(draft), [draft]);
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(parsed.subject);
  const [body, setBody] = useState(parsed.body);
  const [stage, setStage] = useState<Stage>("compose");
  const [sentPayload, setSentPayload] = useState<GmailPayload | null>(null);

  useEffect(() => {
    if (open) {
      setTo(defaultTo);
      setCc("");
      setSubject(parsed.subject);
      setBody(parsed.body);
      setStage("compose");
      setSentPayload(null);
    }
  }, [open, defaultTo, parsed.subject, parsed.body]);

  async function send() {
    const start = performance.now();
    setStage("sending");
    await new Promise(r => setTimeout(r, 400));

    const latency = Math.round(performance.now() - start);
    const payload: GmailPayload = {
      from: "founder@stackpulse.app",
      to,
      cc: cc || undefined,
      subject,
      body,
      thread_id: `thread-${randomId(12)}`,
      message_id: `<${randomId(20)}@stackpulse.local>`,
      sent_at: new Date().toISOString(),
      latency_ms: latency,
      size_kb: Math.max(1, Math.round((subject.length + body.length) / 1024 * 10) / 10 || 0.4),
    };
    setSentPayload(payload);
    setStage("sent");
    await onSent(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (stage === "compose" || stage === "sent") onOpenChange(v); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b border-border bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            {stage === "sent" ? "Draft approved" : "Approve draft reply"}
            <Badge variant="outline" className="ml-auto text-[10px]">simulation</Badge>
          </DialogTitle>
        </DialogHeader>

        {stage !== "sent" ? (
          <>
            <div className="px-5 py-3 space-y-2 text-sm">
              <Row label="From"><span className="text-muted-foreground">founder@stackpulse.app</span></Row>
              <Row label="To"><Input value={to} onChange={e => setTo(e.target.value)} className="h-8 border-0 px-0 focus-visible:ring-0" disabled={stage !== "compose"} /></Row>
              <Row label="Cc"><Input value={cc} onChange={e => setCc(e.target.value)} placeholder="optional" className="h-8 border-0 px-0 focus-visible:ring-0" disabled={stage !== "compose"} /></Row>
              <Row label="Subject"><Input value={subject} onChange={e => setSubject(e.target.value)} className="h-8 border-0 px-0 font-medium focus-visible:ring-0" disabled={stage !== "compose"} /></Row>
            </div>
            <div className="px-5 pb-3">
              <Textarea value={body} onChange={e => setBody(e.target.value)} rows={12} className="font-sans text-sm resize-none" disabled={stage !== "compose"} />
            </div>

            {stage === "sending" && (
              <div className="px-5 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Logging approved draft…
              </div>
            )}

            <DialogFooter className="px-5 py-3 border-t border-border bg-muted/20 flex sm:justify-between items-center gap-2">
              <div className="text-xs text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> No attachments</span>
                <span>·</span>
                <span>{(subject.length + body.length).toLocaleString()} chars</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={stage !== "compose"}>Cancel</Button>
                <Button size="sm" onClick={send} disabled={stage !== "compose" || !to.trim() || !subject.trim()}>
                  {stage === "compose" ? <Send className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  Approve
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : sentPayload && (
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Draft logged to activity</span>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono space-y-1">
              <KV k="message-id" v={sentPayload.message_id} />
              <KV k="thread-id" v={sentPayload.thread_id} />
              <KV k="to" v={sentPayload.to} />
              {sentPayload.cc && <KV k="cc" v={sentPayload.cc} />}
              <KV k="subject" v={sentPayload.subject} />
              <KV k="logged-at" v={new Date(sentPayload.sent_at).toLocaleString()} />
              <KV k="latency" v={`${sentPayload.latency_ms}ms`} />
              <KV k="size" v={`${sentPayload.size_kb}kb`} />
            </div>
            <p className="text-xs text-muted-foreground">No email was sent. This is a local simulation for review and audit.</p>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /> Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 pb-1">
      <span className="text-xs text-muted-foreground w-14 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2"><span className="text-muted-foreground w-20 shrink-0">{k}:</span><span className="break-all">{v}</span></div>
  );
}
