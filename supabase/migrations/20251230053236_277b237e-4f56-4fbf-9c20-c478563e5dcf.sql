-- Drop and recreate the words_secure view to include admin access and context column
DROP VIEW IF EXISTS public.words_secure;

CREATE VIEW public.words_secure 
WITH (security_invoker = true)
AS
SELECT 
  w.id,
  w.source_word,
  w.source_language,
  w.translation,
  w.target_language,
  w.word_type,
  w.niveau,
  w.thema,
  w.context,
  w.shared,
  w.created_at,
  w.updated_at,
  w.seen,
  w.view_count,
  w.quiz_view_count,
  w.incorrect_count,
  -- Only show user_id for own words or for admins, mask it for shared words from others
  CASE 
    WHEN w.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN w.user_id
    ELSE NULL
  END as user_id
FROM public.words w
WHERE w.shared = 'Yes' 
  OR w.user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role);