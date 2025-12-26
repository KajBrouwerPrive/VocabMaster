-- Allow all authenticated users to read shared words while keeping private words restricted to their owner
DROP POLICY IF EXISTS "Users can only view their own words directly" ON public.words;

CREATE POLICY "Users can view own or shared words"
ON public.words
FOR SELECT
USING (
  auth.uid() = user_id
  OR shared = 'Yes'
);
