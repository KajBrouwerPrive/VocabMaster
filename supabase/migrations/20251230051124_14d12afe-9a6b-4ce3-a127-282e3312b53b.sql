-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can only view their own words directly" ON public.words;

-- Create new SELECT policy that allows admins to view ALL words (for admin dashboard)
CREATE POLICY "Users can only view their own words directly" 
ON public.words 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
);