-- Create a secure view that hides user_id for shared words from other users
CREATE OR REPLACE VIEW public.words_secure AS
SELECT 
  id,
  source_word,
  source_language,
  translation,
  target_language,
  word_type,
  shared,
  seen,
  view_count,
  quiz_view_count,
  incorrect_count,
  created_at,
  updated_at,
  -- Only show user_id for own words, NULL for others' shared words
  CASE 
    WHEN user_id = auth.uid() THEN user_id
    ELSE NULL
  END AS user_id
FROM public.words;

-- Enable RLS on the view
ALTER VIEW public.words_secure SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON public.words_secure TO authenticated;