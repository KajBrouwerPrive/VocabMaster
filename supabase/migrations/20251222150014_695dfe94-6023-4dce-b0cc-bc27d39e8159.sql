-- Add correct_count column to user_word_progress
ALTER TABLE public.user_word_progress 
ADD COLUMN correct_count integer NOT NULL DEFAULT 0;

-- Also add to user_conjugation_progress for consistency
ALTER TABLE public.user_conjugation_progress 
ADD COLUMN correct_count integer NOT NULL DEFAULT 0;