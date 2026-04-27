import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "./deviceId";

const SEED_FLAG = "founderos-seeded-v1";

const EMAILS = [
  {
    sender_name: "Sarah Chen",
    sender_email: "sarah@acmevc.com",
    subject: "Quick check on Q2 numbers",
    body: "Hey Paul — promised I'd circle back after Mar close. Could you send the latest MRR trajectory and a quick note on customer concentration? Our partners meet Friday and I'd love to share an update.\n\n— Sarah, Acme Ventures",
    category: "important",
    importance: "high",
    status: "unread",
    detected_intent: "Send updated MRR report to investor",
    detected_urgency: "high",
    detected_sources: ["google_sheets", "notion", "stripe"],
  },
  {
    sender_name: "Karri Saarinen",
    sender_email: "karri@linear.app",
    subject: "Quarterly check-in?",
    body: "Hey — it's been a quarter. Want to grab 30 mins next week to review usage and see what we can unlock? Tuesday or Thursday afternoon work for us.",
    category: "action_required",
    importance: "normal",
    status: "unread",
    detected_intent: "Schedule quarterly customer check-in",
    detected_urgency: "medium",
    detected_sources: ["calendar", "hubspot"],
  },
  {
    sender_name: "Y Combinator",
    sender_email: "partner@ycombinator.com",
    subject: "Demo Day prep — progress update",
    body: "Paul, can you share where you are on hiring + revenue this week? We'd like to feature three companies and need a 5-line update by EOD Wednesday.",
    category: "action_required",
    importance: "high",
    status: "unread",
    detected_intent: "Draft 5-line progress update for YC partner",
    detected_urgency: "high",
    detected_sources: ["notion", "stripe", "google_sheets"],
  },
  {
    sender_name: "Marcus Rivera",
    sender_email: "marcus.r@growth-saas.io",
    subject: "Boost your MRR 3x with our outbound engine",
    body: "Hey founder — saw you on LinkedIn. We help SaaS companies 3x their pipeline in 60 days. Free trial, no commitment. Worth a quick call?",
    category: "cold",
    importance: "low",
    status: "unread",
    detected_intent: null,
    detected_urgency: null,
    detected_sources: null,
  },
  {
    sender_name: "Stripe",
    sender_email: "no-reply@stripe.com",
    subject: "Your April payout is on its way",
    body: "Your payout of $47,981.20 is scheduled for arrival on May 2.",
    category: "important",
    importance: "normal",
    status: "unread",
    detected_intent: null,
    detected_urgency: null,
    detected_sources: null,
  },
  {
    sender_name: "Devon Park",
    sender_email: "devon@northwind-customer.com",
    subject: "Renewal discussion",
    body: "Our annual contract is up in 3 weeks. We're happy but procurement needs a renewal proposal with the multi-year discount you mentioned. Can you send something this week?",
    category: "action_required",
    importance: "high",
    status: "unread",
    detected_intent: "Send multi-year renewal proposal to existing customer",
    detected_urgency: "high",
    detected_sources: ["hubspot", "notion"],
  },
];

export async function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  const device_id = getDeviceId();

  const { count } = await supabase
    .from("emails")
    .select("id", { count: "exact", head: true })
    .eq("device_id", device_id);

  if ((count ?? 0) === 0) {
    const now = Date.now();
    const rows = EMAILS.map((e, i) => ({
      ...e,
      device_id,
      received_at: new Date(now - i * 1000 * 60 * 47).toISOString(),
    }));
    await supabase.from("emails").insert(rows);
  }
  localStorage.setItem(SEED_FLAG, "1");
}
