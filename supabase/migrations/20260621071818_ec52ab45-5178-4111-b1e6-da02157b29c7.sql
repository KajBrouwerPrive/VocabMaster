
-- 1. Fix SELECT policies to include shared rows
DROP POLICY IF EXISTS "Users can only view their own words directly" ON public.words;
CREATE POLICY "Users can view own or shared words"
ON public.words FOR SELECT
USING (auth.uid() = user_id OR shared = 'Yes' OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can only view their own conjugations directly" ON public.verb_conjugations;
CREATE POLICY "Users can view own or shared conjugations"
ON public.verb_conjugations FOR SELECT
USING (auth.uid() = user_id OR shared = 'Yes' OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Explicit admin-only write policies for user_roles (defense in depth)
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Revoke EXECUTE on unused/anon-accessible SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.get_words_secure() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_conjugations_secure() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_words_with_shared() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
