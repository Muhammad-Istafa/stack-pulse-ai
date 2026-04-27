import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "./deviceId";

export async function logActivity(
  agent: "ops" | "tech",
  action: "approved" | "ignored" | "generated",
  title: string,
  detail?: string,
) {
  await supabase.from("activity_log").insert({
    device_id: getDeviceId(),
    agent,
    action,
    title,
    detail: detail ?? null,
  });
}
