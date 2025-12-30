-- Add context column to words table
ALTER TABLE public.words 
ADD COLUMN context text;