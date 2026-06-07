import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Loader2, Plus, Sparkles, Wand2, Trash2, Clock, AlertTriangle, Zap } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { logActivity } from "@/lib/activity";
import SimulationBadge from "@/components/SimulationBadge";
import { format, startOfWeek, addDays, isSameDay, addMinutes, differenceInMinutes, addWeeks, subWeeks, isSameWeek } from "date-fns";
import { toast } from "@/hooks/use-toast";

type Event = {
  id: string;
  title: string;
  detail: string | null;
  scheduled_for: string;
  status: string;
  source: string | null;
  priority: string;
  rescheduled_from: string | null;
};

const PRIORITY_META: Record<string, { label: string; bg: string; ring: string; dot: string; tint: string }> = {
  urgent:   { label: "Urgent",   bg: "bg-destructive/10",  ring: "border-destructive/40", dot: "bg-destructive",  tint: "text-destructive" },
  moderate: { label: "Moderate", bg: "bg-warning/10",       ring: "border-warning/40",     dot: "bg-warning",      tint: "text-warning" },
  flexible: { label: "Flexible", bg: "bg-primary/10",       ring: "border-primary/30",     dot: "bg-primary",      tint: "text-primary" },
};

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 8 AM – 7 PM

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<"all" | "urgent" | "moderate" | "flexible">("all");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(false);
  const [balancing, setBalancing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", detail: "", priority: "moderate", date: format(new Date(), "yyyy-MM-dd"), time: "10:00" });

  useEffect(() => { document.title = "Calendar · Stack Pulse"; }, []);
  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("calendar_events").select("*")
      .eq("device_id", getDeviceId())
      .order("scheduled_for", { ascending: true });
    setEvents((data ?? []) as Event[]);
    setLoading(false);
  }

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const filtered = useMemo(() => filter === "all" ? events : events.filter(e => e.priority === filter), [events, filter]);
  const weekEvents = useMemo(() => filtered.filter(e => isSameWeek(new Date(e.scheduled_for), weekStart, { weekStartsOn: 1 })), [filtered, weekStart]);

  const counts = useMemo(() => {
    const week = events.filter(e => isSameWeek(new Date(e.scheduled_for), weekStart, { weekStartsOn: 1 }));
    return {
      all: week.length,
      urgent: week.filter(e => e.priority === "urgent").length,
      moderate: week.filter(e => e.priority === "moderate").length,
      flexible: week.filter(e => e.priority === "flexible").length,
    };
  }, [events, weekStart]);

  async function createEvent() {
    if (!draft.title.trim()) return;
    const when = new Date(`${draft.date}T${draft.time}:00`);
    await supabase.from("calendar_events").insert({
      device_id: getDeviceId(),
      title: draft.title.trim(),
      detail: draft.detail.trim() || null,
      scheduled_for: when.toISOString(),
      priority: draft.priority,
      source: "manual",
      status: "scheduled",
    });
    setCreateOpen(false);
    setDraft({ title: "", detail: "", priority: "moderate", date: format(new Date(), "yyyy-MM-dd"), time: "10:00" });
    await logActivity("ops", "approved", `Calendar: ${draft.title.trim()}`, `${format(when, "EEE MMM d, h:mm a")} · ${draft.priority}`);
    load();
  }

  async function removeEvent(ev: Event) {
    await supabase.from("calendar_events").delete().eq("id", ev.id);
    load();
  }

  async function autoBalance() {
    setBalancing(true);
    try {
      const week = [...weekEvents].sort((a, b) => +new Date(a.scheduled_for) - +new Date(b.scheduled_for));
      const urgents = week.filter(e => e.priority === "urgent");
      const flexibles = week.filter(e => e.priority === "flexible");
      let moved = 0;

      for (const flex of flexibles) {
        const flexStart = new Date(flex.scheduled_for);
        const flexEnd = addMinutes(flexStart, 60);
        const conflict = urgents.find(u => {
          const us = new Date(u.scheduled_for);
          const ue = addMinutes(us, 60);
          return flexStart < ue && us < flexEnd;
        });
        if (!conflict) continue;
        let candidate = addMinutes(new Date(conflict.scheduled_for), 60);
        let attempts = 0;
        while (attempts < 12) {
          const cs = candidate;
          const ce = addMinutes(cs, 60);
          const hour = cs.getHours();
          const taken = week.some(e => {
            if (e.id === flex.id) return false;
            const es = new Date(e.scheduled_for);
            const ee = addMinutes(es, 60);
            return cs < ee && es < ce;
          });
          if (!taken && hour >= 8 && hour < 19 && isSameDay(cs, flexStart)) break;
          candidate = addMinutes(candidate, 60);
          attempts++;
        }
        await supabase.from("calendar_events").update({
          scheduled_for: candidate.toISOString(),
          rescheduled_from: flex.scheduled_for,
        }).eq("id", flex.id);
        moved++;
      }

      await load();
      if (moved > 0) {
        await logActivity("ops", "approved", `AI auto-balanced calendar (${moved} moved)`, `Week of ${format(weekStart, "MMM d")}`);
        toast({ title: "Calendar rebalanced", description: `${moved} flexible event${moved > 1 ? "s" : ""} moved to free slots.` });
      } else {
        toast({ title: "Already optimal", description: "No conflicts between urgent and flexible items this week." });
      }
    } finally {
      setBalancing(false);
    }
  }

  function eventStyle(ev: Event): React.CSSProperties {
    const start = new Date(ev.scheduled_for);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const top = Math.max(0, (startHour - 8)) * 56;
    return { top: `${top}px`, height: `52px` };
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
              <SimulationBadge />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combined timeline for Ops + Tech. AI prevents overload by sliding flexible items around urgent ones.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={autoBalance} disabled={balancing || loading}>
              {balancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              AI auto-balance
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New event</Button>
          </div>
        </header>

        <Card className="p-3 shadow-card flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-3">
            <Button size="sm" variant="ghost" onClick={() => setWeekStart(prev => subWeeks(prev, 1))}>‹</Button>
            <div className="text-sm font-medium min-w-[200px] text-center">
              {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setWeekStart(prev => addWeeks(prev, 1))}>›</Button>
            <Button size="sm" variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {(["all", "urgent", "moderate", "flexible"] as const).map(k => {
              const meta = k === "all" ? null : PRIORITY_META[k];
              const active = filter === k;
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`text-[11px] uppercase tracking-wider px-2.5 py-1.5 rounded-md border transition-colors flex items-center gap-1.5 ${
                    active ? "bg-muted text-foreground border-border" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {meta && <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
                  {k === "all" ? "All" : meta!.label}
                  <span className="opacity-60">({counts[k]})</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="shadow-card overflow-hidden">
          <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-border">
            <div className="bg-muted/30" />
            {days.map(d => {
              const today = isSameDay(d, new Date());
              return (
                <div key={d.toISOString()} className={`px-2 py-2 text-center border-l border-border ${today ? "bg-primary/5" : ""}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(d, "EEE")}</div>
                  <div className={`text-sm font-semibold ${today ? "text-primary" : ""}`}>{format(d, "d")}</div>
                </div>
              );
            })}
          </div>

          <div className="relative grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
            <div>
              {HOURS.map(h => (
                <div key={h} className="h-14 border-b border-border/60 text-[10px] text-muted-foreground px-2 pt-1 text-right">
                  {h % 12 === 0 ? 12 : h % 12} {h < 12 ? "AM" : "PM"}
                </div>
              ))}
            </div>
            {days.map(d => {
              const dayEvents = weekEvents.filter(e => isSameDay(new Date(e.scheduled_for), d));
              return (
                <div key={d.toISOString()} className="relative border-l border-border" style={{ height: HOURS.length * 56 }}>
                  {HOURS.map(h => (
                    <div key={h} className="h-14 border-b border-border/60" />
                  ))}
                  {dayEvents.map(ev => {
                    const meta = PRIORITY_META[ev.priority] ?? PRIORITY_META.moderate;
                    return (
                      <div
                        key={ev.id}
                        style={eventStyle(ev)}
                        className={`absolute left-1 right-1 ${meta.bg} ${meta.ring} border rounded-md p-1.5 group hover:shadow-glow transition-all cursor-pointer overflow-hidden`}
                        title={ev.detail ?? ev.title}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} shrink-0`} />
                          <div className="text-[11px] font-medium leading-tight truncate flex-1">{ev.title}</div>
                          {ev.rescheduled_from && (
                            <Zap className="h-2.5 w-2.5 text-primary shrink-0" aria-label="AI moved" />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeEvent(ev); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="delete"
                          >
                            <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{format(new Date(ev.scheduled_for), "h:mm a")}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 shadow-card lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">This week's agenda</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{weekEvents.length} events</span>
            </div>
            {weekEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events match the current filter.</p>
            ) : (
              <ul className="divide-y divide-border">
                {weekEvents.map(ev => {
                  const meta = PRIORITY_META[ev.priority] ?? PRIORITY_META.moderate;
                  return (
                    <li key={ev.id} className="py-2 flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${meta.dot} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{ev.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {format(new Date(ev.scheduled_for), "EEE MMM d, h:mm a")}
                          {ev.rescheduled_from && (
                            <span className="ml-1.5 text-primary inline-flex items-center gap-0.5">
                              · <Sparkles className="h-2.5 w-2.5" /> AI rescheduled from {format(new Date(ev.rescheduled_from), "h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] uppercase ${meta.tint} ${meta.ring}`}>{meta.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Overload check</span>
            </div>
            {(() => {
              const byDay = days.map(d => ({ d, count: weekEvents.filter(e => isSameDay(new Date(e.scheduled_for), d)).length }));
              const max = Math.max(...byDay.map(x => x.count), 0);
              const heaviest = byDay.find(x => x.count === max);
              return (
                <>
                  <div className="text-2xl font-semibold">{max} events</div>
                  <div className="text-xs text-muted-foreground">Heaviest day: {heaviest && max > 0 ? format(heaviest.d, "EEEE") : "—"}</div>
                  {max >= 4 && (
                    <p className="text-xs mt-3 text-warning">⚠ {max >= 5 ? "Overloaded" : "Heavy"} day detected. Try AI auto-balance to spread flexible items.</p>
                  )}
                  {max < 4 && max > 0 && <p className="text-xs mt-3 text-success">Balanced — no overload detected.</p>}
                </>
              );
            })()}
          </Card>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New calendar event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Investor sync · Acme Ventures" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input value={draft.detail} onChange={e => setDraft(d => ({ ...d, detail: e.target.value }))} placeholder="Optional details" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Time</Label>
                <Input type="time" value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={draft.priority} onValueChange={v => setDraft(d => ({ ...d, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Urgent — fixed, can't move</SelectItem>
                  <SelectItem value="moderate">🟡 Moderate — prefer this slot</SelectItem>
                  <SelectItem value="flexible">🟢 Flexible — AI can reschedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createEvent} disabled={!draft.title.trim()}>Create event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

void differenceInMinutes;
