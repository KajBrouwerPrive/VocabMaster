-- Drop existing policies
DROP POLICY IF EXISTS "Users can view shared and own words" ON public.words;
DROP POLICY IF EXISTS "Users can insert words" ON public.words;
DROP POLICY IF EXISTS "Users can update words" ON public.words;
DROP POLICY IF EXISTS "Users can delete words" ON public.words;

-- Recreate policies using shared = 'Yes' instead of user_id IS NULL
CREATE POLICY "Users can view shared and own words" 
ON public.words 
FOR SELECT 
USING ((shared = 'Yes') OR (auth.uid() = user_id));

CREATE POLICY "Users can insert words" 
ON public.words 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR ((shared = 'Yes') AND has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can update words" 
ON public.words 
FOR UPDATE 
USING ((auth.uid() = user_id) OR ((shared = 'Yes') AND has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users can delete words" 
ON public.words 
FOR DELETE 
USING ((auth.uid() = user_id) OR ((shared = 'Yes') AND has_role(auth.uid(), 'admin'::app_role)));