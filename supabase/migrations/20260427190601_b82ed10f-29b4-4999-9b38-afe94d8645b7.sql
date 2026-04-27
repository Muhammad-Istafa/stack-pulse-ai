-- Drop old Stack Sentinel tables
DROP TABLE IF EXISTS public.updates CASCADE;
DROP TABLE IF EXISTS public.stack_tools CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.cost_impact_type CASCADE;

-- Status enum
CREATE TYPE public.task_status AS ENUM ('draft', 'approved', 'ignored');

-- Ops tasks (Paul's email drafts etc.)
CREATE TABLE public.ops_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  context JSONB,
  output TEXT,
  status public.task_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tech tasks (Sam's 3-stage recommendations)
CREATE TABLE public.tech_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  recommendation TEXT,
  sandbox_test TEXT,
  migration_plan TEXT,
  status public.task_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  agent TEXT NOT NULL, -- 'ops' | 'tech'
  action TEXT NOT NULL, -- 'approved' | 'ignored' | 'generated'
  title TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ops_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Public access (per-device, no auth)
CREATE POLICY "Public all ops" ON public.ops_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public all tech" ON public.tech_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public all activity" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_ops_device ON public.ops_tasks(device_id, created_at DESC);
CREATE INDEX idx_tech_device ON public.tech_tasks(device_id, created_at DESC);
CREATE INDEX idx_activity_device ON public.activity_log(device_id, created_at DESC);