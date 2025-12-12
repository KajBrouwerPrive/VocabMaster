-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles: users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Drop existing RLS policies on words table
DROP POLICY IF EXISTS "Users can view their own words" ON public.words;
DROP POLICY IF EXISTS "Users can insert their own words" ON public.words;
DROP POLICY IF EXISTS "Users can update their own words" ON public.words;
DROP POLICY IF EXISTS "Users can delete their own words" ON public.words;

-- New RLS policies for words: users can see shared words (user_id IS NULL) OR their own words
CREATE POLICY "Users can view shared and own words"
ON public.words
FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);

-- Users can insert their own words (user_id must match their id)
-- Admins can insert shared words (user_id = NULL)
CREATE POLICY "Users can insert words"
ON public.words
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR (user_id IS NULL AND public.has_role(auth.uid(), 'admin'))
);

-- Users can update their own words, admins can update shared words
CREATE POLICY "Users can update words"
ON public.words
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR (user_id IS NULL AND public.has_role(auth.uid(), 'admin'))
);

-- Users can delete their own words, admins can delete shared words
CREATE POLICY "Users can delete words"
ON public.words
FOR DELETE
USING (
  auth.uid() = user_id 
  OR (user_id IS NULL AND public.has_role(auth.uid(), 'admin'))
);