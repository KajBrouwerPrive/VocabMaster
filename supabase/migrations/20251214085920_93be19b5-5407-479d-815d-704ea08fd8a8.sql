-- Create table for verb conjugations
CREATE TABLE public.verb_conjugations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  infinitive TEXT NOT NULL,
  translation TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'nl',
  target_language TEXT NOT NULL DEFAULT 'en',
  
  -- Present tense (tegenwoordige tijd)
  present_ik TEXT NOT NULL,
  present_jij TEXT NOT NULL,
  present_hij_zij TEXT NOT NULL,
  present_wij TEXT NOT NULL,
  present_jullie TEXT NOT NULL,
  
  -- Past tense (verleden tijd)
  past_ik TEXT NOT NULL,
  past_jij TEXT NOT NULL,
  past_hij_zij TEXT NOT NULL,
  past_wij TEXT NOT NULL,
  past_jullie TEXT NOT NULL,
  
  -- Perfect tense (voltooide tijd)
  perfect_ik TEXT NOT NULL,
  perfect_jij TEXT NOT NULL,
  perfect_hij_zij TEXT NOT NULL,
  perfect_wij TEXT NOT NULL,
  perfect_jullie TEXT NOT NULL,
  
  shared TEXT NOT NULL DEFAULT 'No',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verb_conjugations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view shared and own conjugations"
ON public.verb_conjugations
FOR SELECT
USING ((shared = 'Yes') OR (auth.uid() = user_id));

CREATE POLICY "Users can insert conjugations"
ON public.verb_conjugations
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR ((shared = 'Yes') AND has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can update conjugations"
ON public.verb_conjugations
FOR UPDATE
USING ((auth.uid() = user_id) OR ((shared = 'Yes') AND has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can delete conjugations"
ON public.verb_conjugations
FOR DELETE
USING ((auth.uid() = user_id) OR ((shared = 'Yes') AND has_role(auth.uid(), 'admin'::app_role)));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_verb_conjugations_updated_at
BEFORE UPDATE ON public.verb_conjugations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user progress table for conjugations
CREATE TABLE public.user_conjugation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conjugation_id UUID NOT NULL REFERENCES public.verb_conjugations(id) ON DELETE CASCADE,
  seen BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  quiz_view_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, conjugation_id)
);

-- Enable RLS on progress table
ALTER TABLE public.user_conjugation_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for progress table
CREATE POLICY "Users can view their own conjugation progress"
ON public.user_conjugation_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conjugation progress"
ON public.user_conjugation_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conjugation progress"
ON public.user_conjugation_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conjugation progress"
ON public.user_conjugation_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for progress timestamp updates
CREATE TRIGGER update_user_conjugation_progress_updated_at
BEFORE UPDATE ON public.user_conjugation_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();