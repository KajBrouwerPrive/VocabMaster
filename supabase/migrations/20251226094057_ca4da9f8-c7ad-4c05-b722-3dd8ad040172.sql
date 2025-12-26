-- Drop and recreate the words_secure view to include niveau column
DROP VIEW IF EXISTS public.words_secure;

CREATE VIEW public.words_secure AS
SELECT 
  w.id,
  w.source_word,
  w.source_language,
  w.translation,
  w.target_language,
  w.word_type,
  w.niveau,
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
WHERE w.shared = 'Yes' OR w.user_id = auth.uid();