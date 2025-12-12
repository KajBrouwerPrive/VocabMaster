-- Add view_count column to track how many times a word has been seen in learn mode
ALTER TABLE public.words ADD COLUMN view_count integer NOT NULL DEFAULT 0;