
-- Emails inbox (mock data, per device)
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'unclassified', -- cold, important, action_required, unclassified
  importance TEXT NOT NULL DEFAULT 'normal', -- low, normal, high
  status TEXT NOT NULL DEFAULT 'unread', -- unread, read, completed
  detected_intent TEXT,
  detected_urgency TEXT,
  detected_sources TEXT[],
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all emails" ON public.emails FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_emails_device ON public.emails(device_id, received_at DESC);

-- Workflows (Ops pipelines)
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  trigger TEXT NOT NULL, -- 'email' | 'manual'
  problem TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{id,name,tool,status,output,error}]
  final_output TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, running, awaiting_approval, approved, sent, error
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all workflows" ON public.workflows FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_workflows_device ON public.workflows(device_id, created_at DESC);

-- Calendar events (suggested + approved)
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  source TEXT, -- 'email' | 'manual' | 'agent'
  status TEXT NOT NULL DEFAULT 'suggested', -- suggested, approved, dismissed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all calendar" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

-- Tech intelligence feed items
CREATE TABLE public.tech_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'model_release' | 'pricing' | 'github_trend'
  title TEXT NOT NULL,
  vendor TEXT,
  summary TEXT NOT NULL,
  github_stars INT,
  adoption TEXT, -- 'early' | 'growing' | 'mainstream'
  stability TEXT, -- 'experimental' | 'stable' | 'production'
  relevance_score INT, -- 0-100
  potential_savings_pct INT,
  status TEXT NOT NULL DEFAULT 'new', -- new, reviewing, dismissed, sandboxed, migrating, adopted, rejected
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tech_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all tech_feed" ON public.tech_feed FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_tech_feed_device ON public.tech_feed(device_id, detected_at DESC);

-- Tech analyses (sandbox + impact + migration + AB)
CREATE TABLE public.tech_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  feed_id UUID REFERENCES public.tech_feed(id) ON DELETE CASCADE,
  prompt TEXT,
  sandbox JSONB, -- {sample_input, old_output, new_output, latency_old_ms, latency_new_ms, cost_old, cost_new, quality_note}
  code_impact JSONB, -- {files:[], functions:[], summary}
  migration_plan TEXT,
  ab_test JSONB, -- {users_pct, satisfaction_old, satisfaction_new, p95_old, p95_new, recommendation}
  decision TEXT, -- 'switch' | 'hold' | 'reject'
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, ab_running, completed, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tech_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all tech_analyses" ON public.tech_analyses FOR ALL USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_tech_analyses_updated BEFORE UPDATE ON public.tech_analyses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
