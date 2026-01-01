-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Everyone can read themes
CREATE POLICY "Anyone can view themes" 
ON public.themes 
FOR SELECT 
USING (true);

-- Only admins can manage themes
CREATE POLICY "Admins can insert themes" 
ON public.themes 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update themes" 
ON public.themes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete themes" 
ON public.themes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing themes from words table
INSERT INTO public.themes (name)
SELECT DISTINCT thema FROM public.words 
WHERE thema IS NOT NULL AND thema != ''
ON CONFLICT (name) DO NOTHING;

-- Add theme_id column to words
ALTER TABLE public.words ADD COLUMN theme_id UUID REFERENCES public.themes(id);

-- Update words with their theme_id based on existing thema text
UPDATE public.words w
SET theme_id = t.id
FROM public.themes t
WHERE w.thema = t.name;

-- Drop and recreate the function with new signature
DROP FUNCTION IF EXISTS public.get_words_with_shared();

CREATE FUNCTION public.get_words_with_shared()
RETURNS TABLE(
  id uuid, 
  source_word text, 
  source_language text, 
  translation text, 
  target_language text, 
  word_type text, 
  niveau text, 
  thema text, 
  context text, 
  user_id uuid, 
  shared text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  seen boolean, 
  view_count integer, 
  quiz_view_count integer, 
  incorrect_count integer,
  theme_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    w.id,
    w.source_word,
    w.source_language,
    w.translation,
    w.target_language,
    w.word_type,
    w.niveau,
    COALESCE(t.name, w.thema) as thema,
    w.context,
    CASE 
      WHEN w.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN w.user_id
      ELSE NULL
    END as user_id,
    w.shared,
    w.created_at,
    w.updated_at,
    w.seen,
    w.view_count,
    w.quiz_view_count,
    w.incorrect_count,
    w.theme_id
  FROM public.words w
  LEFT JOIN public.themes t ON w.theme_id = t.id
  WHERE w.shared = 'Yes' 
    OR w.user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
$$;