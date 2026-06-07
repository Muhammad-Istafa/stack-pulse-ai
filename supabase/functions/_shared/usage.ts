import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const AI_LIMIT_MESSAGE = "AI request limit reached. Please try again later.";

export const HOURLY_AI_LIMIT = 10;
export const DAILY_AI_LIMIT = 30;

// Burst protection: max 3 requests per 10 seconds per client (in-memory, per instance)
const BURST_WINDOW_MS = 10_000;
const BURST_MAX = 3;
const burstBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkBurstLimit(clientKey: string): boolean {
  const now = Date.now();
  let bucket = burstBuckets.get(clientKey);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + BURST_WINDOW_MS };
    burstBuckets.set(clientKey, bucket);
  }
  bucket.count += 1;
  return bucket.count <= BURST_MAX;
}

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function checkAndRecordUsage(
  clientKey: string,
  deviceId: string | undefined,
  functionName: string,
  action: string,
): Promise<{ ok: boolean; status?: number }> {
  if (!checkBurstLimit(clientKey)) {
    return { ok: false, status: 429 };
  }

  const supabase = getServiceClient();
  if (!supabase) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY unavailable; skipping persistent usage limits");
    return { ok: true };
  }

  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const [hourly, daily] = await Promise.all([
    supabase
      .from("ai_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("client_key", clientKey)
      .gte("created_at", hourAgo),
    supabase
      .from("ai_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("client_key", clientKey)
      .gte("created_at", dayAgo),
  ]);

  if (hourly.error) console.error("hourly usage check failed", hourly.error.message);
  if (daily.error) console.error("daily usage check failed", daily.error.message);

  if ((hourly.count ?? 0) >= HOURLY_AI_LIMIT) return { ok: false, status: 429 };
  if ((daily.count ?? 0) >= DAILY_AI_LIMIT) return { ok: false, status: 429 };

  const { error } = await supabase.from("ai_usage_log").insert({
    client_key: clientKey,
    device_id: deviceId ?? null,
    function_name: functionName,
    action,
  });
  if (error) console.error("usage log insert failed", error.message);

  return { ok: true };
}
