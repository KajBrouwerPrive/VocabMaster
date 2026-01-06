-- Create table to track which tenses have been learned per conjugation per user
CREATE TABLE public.user_conjugation_tense_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conjugation_id UUID NOT NULL REFERENCES public.verb_conjugations(id) ON DELETE CASCADE,
  tense TEXT NOT NULL,
  seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, conjugation_id, tense)
);

-- Enable RLS
ALTER TABLE public.user_conjugation_tense_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tense progress"
ON public.user_conjugation_tense_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tense progress"
ON public.user_conjugation_tense_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tense progress"
ON public.user_conjugation_tense_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tense progress"
ON public.user_conjugation_tense_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_conjugation_tense_progress_updated_at
BEFORE UPDATE ON public.user_conjugation_tense_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();