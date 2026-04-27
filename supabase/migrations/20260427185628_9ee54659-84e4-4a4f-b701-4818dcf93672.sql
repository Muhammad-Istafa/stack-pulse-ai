
-- Drop FKs to auth.users so we can store device-scoped UUIDs
ALTER TABLE public.stack_tools DROP CONSTRAINT IF EXISTS stack_tools_user_id_fkey;
ALTER TABLE public.updates DROP CONSTRAINT IF EXISTS updates_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Replace RLS with public-access policies (no auth required)
DROP POLICY IF EXISTS "Users view own tools" ON public.stack_tools;
DROP POLICY IF EXISTS "Users insert own tools" ON public.stack_tools;
DROP POLICY IF EXISTS "Users update own tools" ON public.stack_tools;
DROP POLICY IF EXISTS "Users delete own tools" ON public.stack_tools;
CREATE POLICY "Public read tools"   ON public.stack_tools FOR SELECT USING (true);
CREATE POLICY "Public insert tools" ON public.stack_tools FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tools" ON public.stack_tools FOR UPDATE USING (true);
CREATE POLICY "Public delete tools" ON public.stack_tools FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users view own updates" ON public.updates;
DROP POLICY IF EXISTS "Users insert own updates" ON public.updates;
DROP POLICY IF EXISTS "Users delete own updates" ON public.updates;
CREATE POLICY "Public read updates"   ON public.updates FOR SELECT USING (true);
CREATE POLICY "Public insert updates" ON public.updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete updates" ON public.updates FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Public read profiles"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);
