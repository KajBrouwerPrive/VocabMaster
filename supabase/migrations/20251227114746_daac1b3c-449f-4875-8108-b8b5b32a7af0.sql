-- Drop and recreate the words_secure view with SECURITY INVOKER
-- But the issue is the RLS on the words table blocks the view
-- We need to use a SECURITY DEFINER function instead

-- First, create or replace the function to get words securely
CREATE OR REPLACE FUNCTION public.get_words_with_shared()
RETURNS TABLE(
  id uuid,
  source_word text,
  source_language text,
  translation text,
  target_language text,
  word_type text,
  niveau text,
  thema text,
  user_id uuid,
  shared text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  seen boolean,
  view_count integer,
  quiz_view_count integer,
  incorrect_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    w.id,
    w.source_word,
    w.source_language,
    w.translation,
    w.target_language,
    w.word_type,
    w.niveau,
    w.thema,
    -- Only show user_id for own words, mask it for shared words from others
    CASE 
      WHEN w.user_id = auth.uid() THEN w.user_id
      ELSE NULL
    END as user_id,
    w.shared,
    w.created_at,
    w.updated_at,
    w.seen,
    w.view_count,
    w.quiz_view_count,
    w.incorrect_count
  FROM public.words w
  WHERE w.shared = 'Yes' OR w.user_id = auth.uid()
$$;

-- Now recreate the view using this function
DROP VIEW IF EXISTS public.words_secure;

CREATE VIEW public.words_secure AS
SELECT * FROM public.get_words_with_shared();