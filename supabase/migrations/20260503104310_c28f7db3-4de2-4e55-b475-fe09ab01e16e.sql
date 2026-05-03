
-- Fix function search_path warning
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Public all emails" ON public.emails;
DROP POLICY IF EXISTS "Public all commitments" ON public.commitments;
DROP POLICY IF EXISTS "Public all workflows" ON public.workflows;
DROP POLICY IF EXISTS "Public all activity" ON public.activity_log;
DROP POLICY IF EXISTS "Public all calendar" ON public.calendar_events;
DROP POLICY IF EXISTS "Public all ops" ON public.ops_tasks;
DROP POLICY IF EXISTS "Public all tech" ON public.tech_tasks;
DROP POLICY IF EXISTS "Public all tech_analyses" ON public.tech_analyses;
DROP POLICY IF EXISTS "Public all tech_feed" ON public.tech_feed;

-- Helper to apply owner policies
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['emails','commitments','workflows','activity_log','calendar_events','ops_tasks','tech_tasks','tech_analyses','tech_feed']
  LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() = device_id);', t||'_select_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = device_id);', t||'_insert_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = device_id) WITH CHECK (auth.uid() = device_id);', t||'_update_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (auth.uid() = device_id);', t||'_delete_own', t);
  END LOOP;
END$$;

-- profiles: add DELETE policy
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
