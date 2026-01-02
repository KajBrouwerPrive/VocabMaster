-- Update words_secure view to include admin access
CREATE OR REPLACE VIEW public.words_secure AS
SELECT 
  w.id,
  w.created_at,
  w.updated_at,
  w.seen,
  w.view_count,
  w.quiz_view_count,
  w.incorrect_count,
  CASE
    WHEN w.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN w.user_id
    ELSE NULL::uuid
  END AS user_id,
  w.source_word,
  w.source_language,
  w.translation,
  w.target_language,
  w.word_type,
  w.niveau,
  w.context,
  w.shared,
  w.theme_id
FROM public.words w
WHERE w.shared = 'Yes'
   OR w.user_id = auth.uid()
   OR has_role(auth.uid(), 'admin'::app_role);