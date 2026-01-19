-- Change duration_seconds from integer to numeric for millisecond precision
ALTER TABLE public.quiz_results 
ALTER COLUMN duration_seconds TYPE numeric USING duration_seconds::numeric;