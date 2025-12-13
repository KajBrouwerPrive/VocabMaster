-- Drop created_by column and add shared column
ALTER TABLE public.words DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.words ADD COLUMN shared text NOT NULL DEFAULT 'No';