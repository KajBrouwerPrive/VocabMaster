-- Add incorrect_count column to track how many times a word was answered incorrectly in quiz
ALTER TABLE public.words ADD COLUMN incorrect_count integer NOT NULL DEFAULT 0;