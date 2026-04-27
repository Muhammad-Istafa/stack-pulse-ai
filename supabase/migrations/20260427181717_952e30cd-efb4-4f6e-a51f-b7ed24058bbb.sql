-- Enum for cost impact
CREATE TYPE public.cost_impact_type AS ENUM ('positive', 'negative', 'neutral');

-- Profiles table
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  github_org TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Stack tools
CREATE TABLE public.stack_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  category TEXT NOT NULL,
  monthly_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stack_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tools" ON public.stack_tools
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tools" ON public.stack_tools
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tools" ON public.stack_tools
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own tools" ON public.stack_tools
  FOR DELETE USING (auth.uid() = user_id);

-- Updates
CREATE TABLE public.updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  cost_impact public.cost_impact_type NOT NULL DEFAULT 'neutral',
  urgency_score INT NOT NULL DEFAULT 5,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own updates" ON public.updates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own updates" ON public.updates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own updates" ON public.updates
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();