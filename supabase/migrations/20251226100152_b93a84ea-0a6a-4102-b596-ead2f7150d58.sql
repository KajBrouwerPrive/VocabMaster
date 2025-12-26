-- Add thema column to words table
ALTER TABLE public.words ADD COLUMN thema text DEFAULT NULL;

-- Update the words_secure view to include thema
DROP VIEW IF EXISTS public.words_secure;
CREATE VIEW public.words_secure WITH (security_invoker = true) AS
SELECT 
  id,
  source_word,
  source_language,
  translation,
  target_language,
  word_type,
  niveau,
  thema,
  CASE 
    WHEN user_id = auth.uid() THEN user_id
    ELSE NULL
  END as user_id,
  shared,
  created_at,
  updated_at,
  seen,
  view_count,
  quiz_view_count,
  incorrect_count
FROM public.words
WHERE shared = 'Yes' OR user_id = auth.uid();