import { supabase } from "@/integrations/supabase/client";

export interface Word {
  id: string;
  source_word: string;
  source_language: string;
  translation: string;
  target_language: string;
  seen: boolean;
  created_at: string;
  updated_at: string;
}

export interface WordSuggestion {
  word: string;
  translation: string;
}

// Translate a word using AI
export async function translateWord(
  word: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-word`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ word, sourceLanguage, targetLanguage }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Vertaling mislukt");
  }

  const data = await response.json();
  return data.translation;
}

// Get AI word suggestions
export async function getWordSuggestions(
  sourceLanguage: string,
  targetLanguage: string,
  category?: string,
  count: number = 10
): Promise<WordSuggestion[]> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-words`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ sourceLanguage, targetLanguage, category, count }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Suggesties ophalen mislukt");
  }

  const data = await response.json();
  return data.suggestions;
}

// Add a word to the database
export async function addWord(
  sourceWord: string,
  sourceLanguage: string,
  translation: string,
  targetLanguage: string
): Promise<Word> {
  const { data, error } = await supabase
    .from("words")
    .insert({
      source_word: sourceWord,
      source_language: sourceLanguage,
      translation: translation,
      target_language: targetLanguage,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Dit woord bestaat al");
    }
    throw new Error(error.message);
  }

  return data;
}

// Add multiple words at once
export async function addWords(
  words: { sourceWord: string; translation: string }[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<Word[]> {
  const { data, error } = await supabase
    .from("words")
    .insert(
      words.map((w) => ({
        source_word: w.sourceWord,
        source_language: sourceLanguage,
        translation: w.translation,
        target_language: targetLanguage,
      }))
    )
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Get all words
export async function getWords(
  sourceLanguage?: string,
  targetLanguage?: string
): Promise<Word[]> {
  let query = supabase.from("words").select("*").order("created_at", { ascending: false });

  if (sourceLanguage) {
    query = query.eq("source_language", sourceLanguage);
  }
  if (targetLanguage) {
    query = query.eq("target_language", targetLanguage);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Mark a word as seen
export async function markWordAsSeen(wordId: string): Promise<void> {
  const { error } = await supabase
    .from("words")
    .update({ seen: true })
    .eq("id", wordId);

  if (error) {
    throw new Error(error.message);
  }
}

// Mark multiple words as seen
export async function markWordsAsSeen(wordIds: string[]): Promise<void> {
  const { error } = await supabase
    .from("words")
    .update({ seen: true })
    .in("id", wordIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Get random seen words for quiz
export async function getQuizWords(
  count: number,
  sourceLanguage?: string,
  targetLanguage?: string
): Promise<Word[]> {
  let query = supabase
    .from("words")
    .select("*")
    .eq("seen", true);

  if (sourceLanguage) {
    query = query.eq("source_language", sourceLanguage);
  }
  if (targetLanguage) {
    query = query.eq("target_language", targetLanguage);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Shuffle and take requested count
  const shuffled = data.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Delete a word
export async function deleteWord(wordId: string): Promise<void> {
  const { error } = await supabase.from("words").delete().eq("id", wordId);

  if (error) {
    throw new Error(error.message);
  }
}
