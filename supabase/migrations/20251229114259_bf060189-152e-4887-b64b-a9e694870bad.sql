-- Create table for tracking quiz results over time
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_type TEXT NOT NULL, -- 'words' or 'conjugations'
  score_percentage NUMERIC(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  niveau TEXT, -- for word quizzes
  thema TEXT, -- for word quizzes
  tenses TEXT[], -- for conjugation quizzes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own quiz results" 
ON public.quiz_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results" 
ON public.quiz_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz results" 
ON public.quiz_results 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries by user and date
CREATE INDEX idx_quiz_results_user_date ON public.quiz_results (user_id, created_at DESC);
CREATE INDEX idx_quiz_results_score ON public.quiz_results (user_id, score_percentage);