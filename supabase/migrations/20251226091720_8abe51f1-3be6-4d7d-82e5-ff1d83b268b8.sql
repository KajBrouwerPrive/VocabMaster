-- Add niveau column to words table for difficulty level
ALTER TABLE public.words 
ADD COLUMN niveau text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.words.niveau IS 'Difficulty level of the word (e.g., A1, A2, B1, B2, C1, C2)';