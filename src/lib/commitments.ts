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
  return { extracted: rows.length, cached: false };
}
