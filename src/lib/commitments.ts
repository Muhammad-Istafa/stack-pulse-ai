import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "./deviceId";
import { logActivity } from "./activity";

export async function extractCommitmentsForEmail(email: {
  id: string;
  subject: string;
  body: string;
  sender_name: string;
}) {
  // Skip if we already have commitments for this email
  const { data: existing } = await supabase
    .from("commitments")
    .select("id")
    .eq("email_id", email.id)
    .limit(1);
  if (existing && existing.length > 0) return { extracted: 0, cached: true };

  const { data, error } = await supabase.functions.invoke("ops-agent", {
    body: { action: "extract_commitments", subject: email.subject, body: email.body, sender: email.sender_name },
  });
  if (error || data?.error) throw new Error(data?.error ?? error?.message);

  const now = new Date();
  const rows = (data.commitments ?? [])
    .filter((c: any) => c.task && c.task.trim().length > 2)
    .map((c: any) => ({
      device_id: getDeviceId(),
      email_id: email.id,
      task: c.task,
      owner: c.owner === "counterparty" ? "counterparty" : "founder",
      source_quote: c.source_quote || null,
      deadline: c.deadline_iso && c.deadline_iso.trim() ? c.deadline_iso : null,
      status: "pending",
    }));

  if (rows.length === 0) return { extracted: 0, cached: false };

  await supabase.from("commitments").insert(rows);
  await logActivity("ops", "generated", `Extracted ${rows.length} commitment${rows.length > 1 ? "s" : ""} from "${email.subject}"`);

  // Auto-create calendar events for founder-owned commitments with deadlines.
  // Priority is derived from how close the deadline is — urgent if ≤24h or already past.
  const calendarEvents = rows
    .filter((r) => r.owner === "founder" && r.deadline)
    .map((r) => {
      const deadline = new Date(r.deadline as string);
      const hoursUntil = (deadline.getTime() - now.getTime()) / 36e5;
      const priority = hoursUntil <= 24 ? "urgent" : hoursUntil <= 72 ? "moderate" : "flexible";
      return {
        device_id: getDeviceId(),
        title: r.task,
        detail: r.source_quote ? `From "${email.subject}" — ${r.source_quote}` : `From "${email.subject}"`,
        scheduled_for: deadline.toISOString(),
        source: "commitment",
        status: "suggested",
        priority,
      };
    });
  if (calendarEvents.length > 0) {
    await supabase.from("calendar_events").insert(calendarEvents);
  }

  return { extracted: rows.length, cached: false };
}
