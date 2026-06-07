import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "./deviceId";

export async function logActivity(
  agent: "ops" | "tech",
  action: "approved" | "ignored" | "generated",
  title: string,
  detail?: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("activity_log").insert({
    device_id: getDeviceId(),
    agent,
    action,
    title,
    detail: detail ?? null,
  });
  if (error) {
    console.error("Activity log failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
