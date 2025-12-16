-- Create table for conjugation requests
CREATE TABLE public.conjugation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  infinitive text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conjugation_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.conjugation_requests
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Users can insert their own requests
CREATE POLICY "Users can insert their own requests"
ON public.conjugation_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can update requests (status changes)
CREATE POLICY "Admins can update requests"
ON public.conjugation_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
ON public.conjugation_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_conjugation_requests_updated_at
BEFORE UPDATE ON public.conjugation_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();