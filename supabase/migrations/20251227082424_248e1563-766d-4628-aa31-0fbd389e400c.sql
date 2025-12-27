-- Update the words table SELECT policy to only allow viewing own words directly
-- Shared words should be accessed through the words_secure view which masks user_id

DROP POLICY IF EXISTS "Users can view own or shared words" ON public.words;

-- New policy: Users can ONLY view their own words directly
-- Shared words must be accessed via the words_secure view
CREATE POLICY "Users can only view their own words directly" 
ON public.words 
FOR SELECT 
USING (auth.uid() = user_id);