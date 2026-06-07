-- Lightweight AI usage tracking for rate limiting (edge functions)
CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key TEXT NOT NULL,
  device_id UUID,
  function_name TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ai_usage_log" ON public.ai_usage_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert ai_usage_log" ON public.ai_usage_log FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_ai_usage_client_created ON public.ai_usage_log(client_key, created_at DESC);
CREATE INDEX idx_ai_usage_device_created ON public.ai_usage_log(device_id, created_at DESC);
