-- Add column to track if accents were ignored during quiz
ALTER TABLE public.quiz_results
ADD COLUMN ignore_accents boolean DEFAULT false;