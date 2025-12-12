-- Add quiz_view_count column to track how many times a word was shown in quiz mode
-- The existing view_count will be used for learn mode only
ALTER TABLE public.words ADD COLUMN quiz_view_count integer NOT NULL DEFAULT 0;