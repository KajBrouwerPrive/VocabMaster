-- Add DELETE policy for profiles
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to cascade delete user data
CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Delete user's word progress (statistics)
  DELETE FROM public.user_word_progress WHERE user_id = OLD.user_id;
  
  -- Delete words created by this user (not shared words)
  DELETE FROM public.words WHERE user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- Create trigger to run before profile deletion
CREATE TRIGGER on_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_deletion();