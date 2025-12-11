-- Drop the old constraint that doesn't include user_id
DROP INDEX IF EXISTS unique_word_pair;

-- Create new constraint that includes user_id so each user can have their own words
CREATE UNIQUE INDEX unique_word_pair ON public.words USING btree (user_id, lower(source_word), source_language, target_language);