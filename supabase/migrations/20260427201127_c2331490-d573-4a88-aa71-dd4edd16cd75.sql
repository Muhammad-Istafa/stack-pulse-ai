CREATE TABLE public.commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL,
  email_id UUID,
  task TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'founder',
  source_quote TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public all commitments"
ON public.commitments
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER commitments_touch
BEFORE UPDATE ON public.commitments
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_commitments_device ON public.commitments(device_id);
CREATE INDEX idx_commitments_status ON public.commitments(status);

ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS ai_summary TEXT;