-- Delete duplicate entries, keeping only the newest one for each source_word + translation combination
DELETE FROM public.words a
USING public.words b
WHERE a.source_word = b.source_word 
  AND a.translation = b.translation 
  AND a.created_at < b.created_at;

-- Create unique constraint on source_word + translation combination
ALTER TABLE public.words ADD CONSTRAINT words_source_word_translation_unique UNIQUE (source_word, translation);