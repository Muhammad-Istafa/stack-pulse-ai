-- Fix RLS policies: reads worked but INSERT/UPDATE/DELETE were blocked on live DB.
-- Recreate explicit per-operation policies so anon clients can read and write device-scoped data.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'emails', 'commitments', 'activity_log', 'calendar_events', 'workflows',
    'tech_feed', 'tech_analyses', 'ops_tasks', 'tech_tasks'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public all %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public read %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public insert %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public update %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public delete %1$s" ON public.%1$I', t);

    EXECUTE format('CREATE POLICY "Public read %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Public insert %1$s" ON public.%1$I FOR INSERT TO anon, authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "Public update %1$s" ON public.%1$I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "Public delete %1$s" ON public.%1$I FOR DELETE TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

-- Ensure anon/authenticated roles retain table privileges (RLS still applies).
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
