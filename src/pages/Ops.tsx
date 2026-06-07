import { useEffect, useMemo, useState } from "react";
import { Briefcase, Loader2, Mail, Sparkles, Inbox, Check, Pencil, RefreshCw, AlertTriangle, Send, Calendar as CalIcon, Wand2, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { logActivity } from "@/lib/activity";
import { seedIfEmpty } from "@/lib/seed";
import { extractCommitmentsForEmail } from "@/lib/commitments";
import { toast } from "@/hooks/use-toast";
import { WorkflowDiagram, type WorkflowStep } from "@/components/WorkflowDiagram";
import { GmailSendDialog, type GmailPayload } from "@/components/GmailSendDialog";
import CommitmentsPanel from "@/components/CommitmentsPanel";
import SimulationBadge from "@/components/SimulationBadge";
import { format } from "date-fns";

type EmailRow = {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  category: string;
  importance: string;
  status: string;
  detected_intent: string | null;
  detected_urgency: string | null;
  detected_sources: string[] | null;
  ai_summary: string | null;
  received_at: string;
};

type WorkflowRow = {
  id: string;
  problem: string;
  steps: WorkflowStep[];
  final_output: string | null;
  status: string;
  error_message: string | null;
};

const CATEGORY_STYLE: Record<string, string> = {
  important: "bg-primary/15 text-primary border-primary/30",
  action_required: "bg-warning/15 text-warning border-warning/40",
  cold: "bg-muted text-muted-foreground border-border",
};

export default function Ops() {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [selected, setSelected] = useState<EmailRow | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowRow | null>(null);
  const [loading, setLoading] = useState<"" | "extract" | "workflow" | "run" | "approve">("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [manualPrompt, setManualPrompt] = useState("Prepare onboarding email for new client");
  const [tab, setTab] = useState("inbox");
  const [gmailOpen, setGmailOpen] = useState(false);
  const [commitRefresh, setCommitRefresh] = useState(0);

  useEffect(() => { document.title = "Ops Agent · Stack Pulse"; }, []);

  useEffect(() => {
    (async () => {
      const seed = await seedIfEmpty();
      if (!seed.ok) {
        toast({ title: "Database write blocked", description: seed.error ?? "Could not seed demo inbox.", variant: "destructive" });
      }
      await refresh();
    })();
  }, []);

  async function refresh() {
    const { data } = await supabase.from("emails")
      .select("*").eq("device_id", getDeviceId())
      .order("received_at", { ascending: false });
    setEmails((data ?? []) as EmailRow[]);
  }

  const counts = useMemo(() => {
    const c = { important: 0, action_required: 0, cold: 0, all: emails.length };
    emails.forEach(e => { (c as any)[e.category] = ((c as any)[e.category] ?? 0) + 1; });
    return c;
  }, [emails]);

  async function selectEmail(e: EmailRow) {
    setSelected(e);
    setWorkflow(null);
    setEditing(false);
    setDraft("");
    if (e.status === "unread") {
      await supabase.from("emails").update({ status: "read" }).eq("id", e.id);
      setEmails(prev => prev.map(x => x.id === e.id ? { ...x, status: "read" } : x));
    }

    // Kick off commitment extraction (in parallel, non-blocking) and AI summary if missing
    if (e.category !== "cold") {
      extractCommitmentsForEmail({ id: e.id, subject: e.subject, body: e.body, sender_name: e.sender_name })
        .then(r => { if (r.extracted > 0) setCommitRefresh(v => v + 1); })
        .catch(() => { /* silent */ });

      if (!e.ai_summary) {
        supabase.functions.invoke("ops-agent", {
          body: { action: "summarize", device_id: getDeviceId(), subject: e.subject, body: e.body, sender: e.sender_name },
        }).then(async ({ data }) => {
          const summary = data?.summary;
          if (!summary) return;
          await supabase.from("emails").update({ ai_summary: summary }).eq("id", e.id);
          const upd = { ...e, ai_summary: summary };
          setSelected(prev => prev?.id === e.id ? { ...prev, ai_summary: summary } : prev);
          setEmails(prev => prev.map(x => x.id === e.id ? upd : x));
        }).catch(() => { /* silent */ });
      }
    }

    // If not yet analyzed, extract task
    if (!e.detected_intent && e.category !== "cold") {
      setLoading("extract");
      try {
        const { data, error } = await supabase.functions.invoke("ops-agent", {
          body: { action: "extract", device_id: getDeviceId(), subject: e.subject, body: e.body, sender: e.sender_name },
        });
        if (error || data?.error) throw new Error(data?.error ?? error?.message);
        await supabase.from("emails").update({
          detected_intent: data.intent,
          detected_urgency: data.urgency,
          detected_sources: data.data_sources,
        }).eq("id", e.id);
        const updated = { ...e, detected_intent: data.intent, detected_urgency: data.urgency, detected_sources: data.data_sources };
        setSelected(prev => prev?.id === e.id ? { ...prev, ...updated } : prev);
        setEmails(prev => prev.map(x => x.id === e.id ? { ...x, ...updated } : x));
      } catch (err: any) {
        toast({ title: "Couldn't analyze email", description: err.message, variant: "destructive" });
      } finally { setLoading(""); }
    }
  }

  async function buildWorkflow(problem: string, sources: string[], emailId?: string, simulate_error = false) {
    setLoading("workflow");
    setWorkflow(null);
    try {
      const { data: gen, error: e1 } = await supabase.functions.invoke("ops-agent", {
        body: { action: "generate_workflow", device_id: getDeviceId(), problem, sources },
      });
      if (e1 || gen?.error) throw new Error(gen?.error ?? e1?.message);
      const steps = (gen.steps ?? []).map((s: any) => ({ ...s, status: "pending" })) as WorkflowStep[];

      const { data: row } = await supabase.from("workflows").insert({
        device_id: getDeviceId(),
        email_id: emailId ?? null,
        trigger: emailId ? "email" : "manual",
        problem,
        steps,
        status: "running",
      }).select().single();

      setWorkflow(row as any);
      await logActivity("ops", "generated", `Workflow: ${problem}`, `${steps.length} steps`);

      // Animate "running" then call run
      setLoading("run");
      const animated = [...steps];
      for (let i = 0; i < animated.length; i++) {
        animated[i] = { ...animated[i], status: "running" as const };
        setWorkflow(prev => prev ? { ...prev, steps: [...animated] } : prev);
        await new Promise(r => setTimeout(r, 400));
        animated[i] = { ...animated[i], status: "done" as const };
      }

      const { data: ran, error: e2 } = await supabase.functions.invoke("ops-agent", {
        body: { action: "run_workflow", device_id: getDeviceId(), steps, problem, simulate_error },
      });
      if (e2 || ran?.error) throw new Error(ran?.error ?? e2?.message);

      const updated = { ...(row as any), steps: ran.steps, final_output: ran.final_output, status: ran.status, error_message: ran.error_message };
      await supabase.from("workflows").update({
        steps: ran.steps, final_output: ran.final_output, status: ran.status, error_message: ran.error_message,
      }).eq("id", (row as any).id);
      setWorkflow(updated);
      setDraft(ran.final_output ?? "");
    } catch (err: any) {
      toast({ title: "Workflow failed", description: err.message, variant: "destructive" });
    } finally { setLoading(""); }
  }

  function approveAndSend() {
    if (!workflow || !draft) return;
    setGmailOpen(true);
  }

  async function handleGmailSent(payload: GmailPayload) {
    if (!workflow) return;
    setLoading("approve");
    try {
      await supabase.from("workflows").update({
        status: "sent",
        final_output: draft,
      }).eq("id", workflow.id);

      if (selected) {
        await supabase.from("emails").update({ status: "completed" }).eq("id", selected.id);
        setEmails(prev => prev.map(x => x.id === selected.id ? { ...x, status: "completed" } : x));
      }

      const detail = [
        `📧 Draft approved (simulation)`,
        ``,
        `From:    ${payload.from}`,
        `To:      ${payload.to}`,
        payload.cc ? `Cc:      ${payload.cc}` : null,
        `Subject: ${payload.subject}`,
        `Sent:    ${new Date(payload.sent_at).toLocaleString()}`,
        `Latency: ${payload.latency_ms}ms · Size: ${payload.size_kb}kb`,
        `Message-ID: ${payload.message_id}`,
        `Thread-ID:  ${payload.thread_id}`,
        ``,
        `--- Body ---`,
        payload.body,
      ].filter(Boolean).join("\n");

      await logActivity("ops", "approved", `Draft → ${payload.to}: ${payload.subject}`, detail);

      // Calendar suggestion
      const { data: cal } = await supabase.functions.invoke("ops-agent", {
        body: { action: "suggest_calendar", device_id: getDeviceId(), problem: workflow.problem, output: draft },
      });
      if (cal?.create) {
        const when = new Date(Date.now() + (cal.days_from_now ?? 2) * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("calendar_events").insert({
          device_id: getDeviceId(),
          title: cal.title ?? "Follow up",
          detail: cal.detail ?? null,
          scheduled_for: when,
          source: "agent",
          status: "suggested",
        });
        toast({ title: "Sent · calendar follow-up suggested", description: cal.title });
      } else {
        toast({ title: "Draft approved", description: `Logged for ${payload.to} (simulation — no email sent)` });
      }
      setWorkflow(prev => prev ? { ...prev, status: "sent" } : prev);
      setCommitRefresh(v => v + 1);
    } catch (err: any) {
      toast({ title: "Approve failed", description: err.message, variant: "destructive" });
    } finally { setLoading(""); }
  }

  const filteredEmails = (cat: string) => cat === "all" ? emails : emails.filter(e => e.category === cat);

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        <header className="px-6 pt-6 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Ops Agent</h1>
            <Badge variant="secondary" className="ml-1">for Paul</Badge>
            <div className="ml-auto"><SimulationBadge /></div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Inbox → detected task → executable pipeline → drafted reply, ready for your approval.</p>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
          {/* Inbox */}
          <aside className="col-span-3 border-r border-border flex flex-col min-h-0">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm">
                <Inbox className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Inbox</span>
                <span className="ml-auto text-xs text-muted-foreground">{counts.all}</span>
              </div>
            </div>
            <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
              <TabsList className="m-2 grid grid-cols-4">
                <TabsTrigger value="all" className="text-[11px]">All</TabsTrigger>
                <TabsTrigger value="action_required" className="text-[11px]">Action {counts.action_required ? `(${counts.action_required})` : ""}</TabsTrigger>
                <TabsTrigger value="important" className="text-[11px]">Imp.</TabsTrigger>
                <TabsTrigger value="cold" className="text-[11px]">Cold</TabsTrigger>
              </TabsList>
              {(["all", "action_required", "important", "cold"] as const).map(cat => (
                <TabsContent key={cat} value={cat} className="flex-1 min-h-0 m-0">
                  <ScrollArea className="h-full">
                    <ul>
                      {filteredEmails(cat).map(e => (
                        <li key={e.id}>
                          <button
                            onClick={() => selectEmail(e)}
                            className={`w-full text-left px-3 py-3 border-b border-border/60 hover:bg-muted/40 transition-colors ${selected?.id === e.id ? "bg-muted/60" : ""}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm ${e.status === "unread" ? "font-semibold" : "font-medium text-muted-foreground"}`}>{e.sender_name}</span>
                              {e.status === "unread" && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                              {e.status === "completed" && <Badge className="ml-auto bg-success/20 text-success border-success/40 text-[9px] hover:bg-success/20">done</Badge>}
                              <span className={`ml-auto text-[10px] text-muted-foreground ${e.status === "completed" ? "hidden" : ""}`}>{format(new Date(e.received_at), "h:mm a")}</span>
                            </div>
                            <div className="text-xs font-medium line-clamp-1">{e.subject}</div>
                            {e.ai_summary ? (
                              <div className="text-[11px] text-foreground/80 line-clamp-2 mt-0.5"><Sparkles className="h-2.5 w-2.5 inline text-primary mr-1" />{e.ai_summary}</div>
                            ) : (
                              <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{e.body}</div>
                            )}
                            <Badge variant="outline" className={`mt-2 text-[9px] uppercase tracking-wider ${CATEGORY_STYLE[e.category] ?? ""}`}>{e.category.replace("_", " ")}</Badge>
                          </button>
                        </li>
                      ))}
                      {filteredEmails(cat).length === 0 && (
                        <li className="p-6 text-center text-xs text-muted-foreground">Nothing here.</li>
                      )}
                    </ul>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </aside>

          {/* Workspace */}
          <section className="col-span-6 min-h-0 overflow-auto border-r border-border">
            <Tabs value={tab} onValueChange={setTab} className="p-6 space-y-4">
              <TabsList>
                <TabsTrigger value="inbox"><Mail className="h-3.5 w-3.5 mr-1" /> From inbox</TabsTrigger>
                <TabsTrigger value="manual"><Wand2 className="h-3.5 w-3.5 mr-1" /> Manual task</TabsTrigger>
              </TabsList>

              <TabsContent value="inbox" className="space-y-4 mt-2">
                {!selected ? (
                  <Card className="p-12 text-center shadow-card">
                    <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Select an email from the inbox to detect the task and build a workflow.</p>
                  </Card>
                ) : (
                  <>
                    <Card className="p-5 shadow-card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-muted-foreground">{selected.sender_name} · <span className="text-xs">{selected.sender_email}</span></div>
                          <h2 className="text-lg font-semibold mt-0.5">{selected.subject}</h2>
                        </div>
                        <Badge variant="outline" className={`${CATEGORY_STYLE[selected.category]} text-[10px] uppercase tracking-wider`}>{selected.category.replace("_", " ")}</Badge>
                      </div>
                      {selected.ai_summary && (
                        <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm flex items-start gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <span className="leading-snug">{selected.ai_summary}</span>
                        </div>
                      )}
                      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{selected.body}</pre>
                    </Card>

                    {selected.category === "cold" ? (
                      <Card className="p-4 shadow-card text-sm text-muted-foreground flex items-center gap-2">
                        <X className="h-4 w-4" /> Classified as cold outreach — no action needed.
                      </Card>
                    ) : (
                      <Card className="p-5 shadow-card bg-priority border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">Detected task</span>
                          {loading === "extract" && <Loader2 className="h-3 w-3 animate-spin text-primary ml-1" />}
                        </div>
                        {selected.detected_intent ? (
                          <>
                            <div className="font-medium">{selected.detected_intent}</div>
                            <div className="flex flex-wrap gap-2 mt-2 items-center">
                              <Badge variant="secondary" className="text-[10px]">urgency: {selected.detected_urgency}</Badge>
                              {(selected.detected_sources ?? []).map(s => (
                                <Badge key={s} variant="outline" className="text-[10px]">{s.replace("_", " ")}</Badge>
                              ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button size="sm" onClick={() => buildWorkflow(selected.detected_intent!, selected.detected_sources ?? [], selected.id)} disabled={!!loading}>
                                <Wand2 className="h-4 w-4" /> Generate workflow
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">Analyzing…</div>
                        )}
                      </Card>
                    )}

                    {workflow && <WorkflowResult workflow={workflow} editing={editing} setEditing={setEditing} draft={draft} setDraft={setDraft} loading={loading} onApprove={approveAndSend} onRegenerate={() => buildWorkflow(workflow.problem, selected?.detected_sources ?? [], selected?.id)} onRegenerateImproved={() => buildWorkflow(`${workflow.problem} (Improved version: shorter, more direct, lead with the key number, drop pleasantries.)`, selected?.detected_sources ?? [], selected?.id)} />}
                  </>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-2">
                <Card className="p-5 shadow-card space-y-3">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Describe the task</label>
                  <Input value={manualPrompt} onChange={e => setManualPrompt(e.target.value)} placeholder="e.g. Prepare onboarding email for new client" />
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Prepare onboarding email for new client",
                      "Draft monthly investor update",
                      "Reply to YC partner on this week's progress",
                      "Send renewal proposal to Devon Park",
                    ].map(s => (
                      <button key={s} onClick={() => setManualPrompt(s)} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted text-muted-foreground">{s}</button>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => { setSelected(null); buildWorkflow(manualPrompt, ["notion", "google_sheets", "hubspot"]); }} disabled={!!loading || !manualPrompt.trim()}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      Build workflow
                    </Button>
                  </div>
                </Card>

                {workflow && tab === "manual" && <WorkflowResult workflow={workflow} editing={editing} setEditing={setEditing} draft={draft} setDraft={setDraft} loading={loading} onApprove={approveAndSend} onRegenerate={() => buildWorkflow(workflow.problem, ["notion", "google_sheets", "hubspot"])} onRegenerateImproved={() => buildWorkflow(`${workflow.problem} (Improved version: shorter, more direct, lead with the key number, drop pleasantries.)`, ["notion", "google_sheets", "hubspot"])} />}
              </TabsContent>
            </Tabs>
          </section>

          {/* Commitments rail */}
          <aside className="col-span-3 min-h-0 p-3">
            <CommitmentsPanel refreshKey={commitRefresh} />
          </aside>
        </div>
      </div>
      <GmailSendDialog
        open={gmailOpen}
        onOpenChange={setGmailOpen}
        draft={draft}
        defaultTo={selected?.sender_email ?? "founder@example.com"}
        onSent={handleGmailSent}
      />
    </AppLayout>
  );
}

function WorkflowResult({ workflow, editing, setEditing, draft, setDraft, loading, onApprove, onRegenerate, onRegenerateImproved }: any) {
  return (
    <div className="space-y-4">
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Generated workflow</span>
          </div>
          <Badge variant="outline" className="text-[10px]">{workflow.steps?.length ?? 0} steps</Badge>
        </div>
        <WorkflowDiagram steps={workflow.steps ?? []} />
      </Card>

      {workflow.status === "error" ? (
        <Card className="p-5 shadow-card border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Workflow halted</span>
          </div>
          <p className="text-sm">{workflow.error_message}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={onRegenerate}><RefreshCw className="h-4 w-4" /> Fix & rerun</Button>
            <Button size="sm" variant="outline"><Wand2 className="h-4 w-4" /> Change data source</Button>
          </div>
        </Card>
      ) : workflow.final_output ? (
        <Card className="shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Final draft</span>
              {workflow.status === "sent" && <Badge className="bg-success/20 text-success border-success/40 hover:bg-success/20">✓ Sent</Badge>}
            </div>
          </div>
          <div className="p-5">
            {editing ? (
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={16} className="font-mono text-sm" />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{draft}</pre>
            )}
          </div>
          <div className="px-5 py-3 border-t border-border flex justify-end gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onRegenerate} disabled={!!loading}>
              <RefreshCw className="h-4 w-4" /> Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={() => onRegenerateImproved?.()} disabled={!!loading} className="border-primary/40 text-primary hover:bg-primary/10">
              <Sparkles className="h-4 w-4" /> Improved version
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing((v: boolean) => !v)}>
              <Pencil className="h-4 w-4" /> {editing ? "Done editing" : "Edit"}
            </Button>
            <Button size="sm" onClick={onApprove} disabled={workflow.status === "sent" || !!loading}>
              {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Approve & send
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5 shadow-card text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Running pipeline…
        </Card>
      )}
    </div>
  );
}
