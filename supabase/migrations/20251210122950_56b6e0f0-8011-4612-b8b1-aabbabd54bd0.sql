-- Create words table for vocabulary storage
CREATE TABLE public.words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_word TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'nl',
  translation TEXT NOT NULL,
  target_language TEXT NOT NULL,
  seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate words
CREATE UNIQUE INDEX unique_word_pair ON public.words (LOWER(source_word), source_language, target_language);

-- Enable Row Level Security (public access for now - no auth required)
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

-- Create public access policies (no authentication needed)
CREATE POLICY "Allow public read access" ON public.words FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.words FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.words FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.words FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_words_updated_at
BEFORE UPDATE ON public.words
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();