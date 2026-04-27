ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'moderate';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS rescheduled_from TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.tech_analyses ADD COLUMN IF NOT EXISTS confidence INTEGER;
ALTER TABLE public.tech_analyses ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE public.tech_analyses ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tech_analyses ADD COLUMN IF NOT EXISTS rationale TEXT;