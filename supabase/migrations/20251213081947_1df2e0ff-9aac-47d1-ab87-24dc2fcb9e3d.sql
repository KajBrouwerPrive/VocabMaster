-- Add created_by column to track who added the word
ALTER TABLE public.words ADD COLUMN created_by uuid;

-- Update RLS policies to allow reading created_by
-- No policy changes needed since SELECT already works