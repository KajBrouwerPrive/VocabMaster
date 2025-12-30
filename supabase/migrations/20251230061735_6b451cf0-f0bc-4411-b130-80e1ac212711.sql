-- Drop and recreate the function with context field
DROP FUNCTION IF EXISTS public.get_words_with_shared();

CREATE OR REPLACE FUNCTION public.get_words_with_shared()
 RETURNS TABLE(id uuid, source_word text, source_language text, translation text, target_language text, word_type text, niveau text, thema text, context text, user_id uuid, shared text, created_at timestamp with time zone, updated_at timestamp with time zone, seen boolean, view_count integer, quiz_view_count integer, incorrect_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Admins can see user_id, others only see their own
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
    w.incorrect_count
  FROM public.words w
  WHERE w.shared = 'Yes' 
    OR w.user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
$function$;