-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update words" ON public.words;

-- Create new policy that allows admins to update ANY word (for approval workflow)
CREATE POLICY "Users can update words" 
ON public.words 
FOR UPDATE 
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
);