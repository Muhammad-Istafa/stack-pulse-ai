// Returns the authenticated user's id, used as the row owner key (`device_id` column)
// across the app. RLS policies enforce `auth.uid() = device_id`.
import { supabase } from "@/integrations/supabase/client";

let cachedUserId: string | null = null;

// Keep a synchronous cache in sync with auth state so existing call sites
// that expect a sync getter continue to work.
supabase.auth.getSession().then(({ data }) => {
  cachedUserId = data.session?.user?.id ?? null;
});
supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user?.id ?? null;
});

export function getDeviceId(): string {
  // Returning empty string when signed-out causes RLS-protected queries to
  // return no rows rather than leaking data. UI should gate on auth before
  // calling these.
  return cachedUserId ?? "";
}

export async function getDeviceIdAsync(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const { data } = await supabase.auth.getSession();
  cachedUserId = data.session?.user?.id ?? null;
  return cachedUserId ?? "";
}
