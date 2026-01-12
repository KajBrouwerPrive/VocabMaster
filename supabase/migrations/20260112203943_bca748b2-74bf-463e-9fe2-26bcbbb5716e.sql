-- Add duration column to quiz_results table
ALTER TABLE public.quiz_results 
ADD COLUMN duration_seconds integer;

-- Add index for faster queries on duration
CREATE INDEX idx_quiz_results_duration ON public.quiz_results(duration_seconds) WHERE duration_seconds IS NOT NULL;