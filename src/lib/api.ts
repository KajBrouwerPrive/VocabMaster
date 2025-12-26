import { supabase } from "@/integrations/supabase/client";

export interface Word {
  id: string;
  source_word: string;
  source_language: string;
  translation: string;
  target_language: string;
  word_type: string | null;
  niveau: string | null;
  thema: string | null;
  user_id: string | null; // null = shared word, uuid = personal word
  shared: string; // "Yes" if added by admin, "No" otherwise
  created_at: string;
  updated_at: string;
}

export interface WordWithProgress extends Word {
  seen: boolean;
  view_count: number;
  quiz_view_count: number;
  incorrect_count: number;
  correct_count: number;
}

export interface UserWordProgress {
  id: string;
  user_id: string;
  word_id: string;
  seen: boolean;
  view_count: number;
  quiz_view_count: number;
  incorrect_count: number;
  correct_count: number;
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

// Check if user has admin role
async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  
  return !!data;
}

// Add a word to the database
export async function addWord(
  sourceWord: string,
  sourceLanguage: string,
  translation: string,
  targetLanguage: string,
  asShared: boolean = false,
  wordType?: string
): Promise<Word> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn om woorden toe te voegen");

  const isAdmin = await checkIsAdmin(user.id);

  const { data, error } = await supabase
    .from("words")
    .insert({
      source_word: sourceWord,
      source_language: sourceLanguage,
      translation: translation,
      target_language: targetLanguage,
      user_id: asShared ? null : user.id,
      shared: isAdmin ? "Yes" : "No",
      word_type: wordType || null,
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
  targetLanguage: string,
  asShared: boolean = false
): Promise<Word[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn om woorden toe te voegen");

  const isAdmin = await checkIsAdmin(user.id);

  const { data, error } = await supabase
    .from("words")
    .insert(
      words.map((w) => ({
        source_word: w.sourceWord,
        source_language: sourceLanguage,
        translation: w.translation,
        target_language: targetLanguage,
        user_id: asShared ? null : user.id,
        shared: isAdmin ? "Yes" : "No",
      }))
    )
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Get or create user word progress
async function getOrCreateProgress(userId: string, wordId: string): Promise<UserWordProgress> {
  // Try to get existing progress
  const { data: existing } = await supabase
    .from("user_word_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Create new progress
  const { data: created, error } = await supabase
    .from("user_word_progress")
    .insert({
      user_id: userId,
      word_id: wordId,
      seen: false,
      view_count: 0,
      quiz_view_count: 0,
      incorrect_count: 0,
      correct_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return created;
}

// Get all words with user progress
export async function getWordsWithProgress(
  sourceLanguage?: string,
  targetLanguage?: string
): Promise<WordWithProgress[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  let query = supabase
    .from("words_secure")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, 49999); // Remove default 1000 limit

  if (sourceLanguage) {
    query = query.eq("source_language", sourceLanguage);
  }
  if (targetLanguage) {
    query = query.eq("target_language", targetLanguage);
  }

  const { data: words, error: wordsError } = await query;

  if (wordsError) {
    throw new Error(wordsError.message);
  }

  // Cast to include thema field that exists in database but not in generated types
  const wordsWithThema = words as Array<typeof words[number] & { thema?: string | null }>;

  // Get all user progress
  const { data: progress } = await supabase
    .from("user_word_progress")
    .select("*")
    .eq("user_id", user.id);

  const progressMap = new Map<string, UserWordProgress>();
  (progress || []).forEach((p) => {
    progressMap.set(p.word_id, p);
  });

  // Merge words with progress
  return wordsWithThema.map((word) => {
    const p = progressMap.get(word.id!);
    return {
      id: word.id!,
      source_word: word.source_word!,
      source_language: word.source_language!,
      translation: word.translation!,
      target_language: word.target_language!,
      word_type: word.word_type ?? null,
      niveau: word.niveau ?? null,
      thema: word.thema ?? null,
      user_id: word.user_id ?? null,
      shared: word.shared!,
      created_at: word.created_at!,
      updated_at: word.updated_at!,
      seen: p?.seen ?? false,
      view_count: p?.view_count ?? 0,
      quiz_view_count: p?.quiz_view_count ?? 0,
      incorrect_count: p?.incorrect_count ?? 0,
      correct_count: p?.correct_count ?? 0,
    } as WordWithProgress;
  });
}

// Get all words (without progress, for backwards compatibility)
export async function getWords(
  sourceLanguage?: string,
  targetLanguage?: string
): Promise<Word[]> {
  let query = supabase.from("words_secure").select("*").order("created_at", { ascending: false });

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

  // Cast to include thema and niveau fields that exist in database but not in generated types
  const dataWithExtras = data as Array<typeof data[number] & { thema?: string | null; niveau?: string | null }>;

  return dataWithExtras.map((word) => ({
    id: word.id!,
    source_word: word.source_word!,
    source_language: word.source_language!,
    translation: word.translation!,
    target_language: word.target_language!,
    word_type: word.word_type ?? null,
    niveau: word.niveau ?? null,
    thema: word.thema ?? null,
    user_id: word.user_id ?? null,
    shared: word.shared!,
    created_at: word.created_at!,
    updated_at: word.updated_at!,
  })) as Word[];
}

// Mark a word as seen for the current user
export async function markWordAsSeen(wordId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  await getOrCreateProgress(user.id, wordId);

  const { error } = await supabase
    .from("user_word_progress")
    .update({ seen: true })
    .eq("user_id", user.id)
    .eq("word_id", wordId);

  if (error) {
    throw new Error(error.message);
  }
}

// Increment view count for a word (user-specific)
export async function incrementViewCount(wordId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  const progress = await getOrCreateProgress(user.id, wordId);

  const { error } = await supabase
    .from("user_word_progress")
    .update({ view_count: progress.view_count + 1 })
    .eq("user_id", user.id)
    .eq("word_id", wordId);

  if (error) {
    throw new Error(error.message);
  }
}

// Increment incorrect count for a word (user-specific)
export async function incrementIncorrectCount(wordId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  const progress = await getOrCreateProgress(user.id, wordId);

  const { error } = await supabase
    .from("user_word_progress")
    .update({ incorrect_count: progress.incorrect_count + 1 })
    .eq("user_id", user.id)
    .eq("word_id", wordId);

  if (error) {
    throw new Error(error.message);
  }
}

// Increment quiz view count for a word (user-specific)
export async function incrementQuizViewCount(wordId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  const progress = await getOrCreateProgress(user.id, wordId);

  const { error } = await supabase
    .from("user_word_progress")
    .update({ quiz_view_count: progress.quiz_view_count + 1 })
    .eq("user_id", user.id)
    .eq("word_id", wordId);

  if (error) {
    throw new Error(error.message);
  }
}

// Increment correct count for a word (user-specific)
export async function incrementCorrectCount(wordId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  const progress = await getOrCreateProgress(user.id, wordId);

  const { error } = await supabase
    .from("user_word_progress")
    .update({ correct_count: progress.correct_count + 1 })
    .eq("user_id", user.id)
    .eq("word_id", wordId);

  if (error) {
    throw new Error(error.message);
  }
}

// Mark multiple words as seen for the current user
export async function markWordsAsSeen(wordIds: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  // Create progress entries for all words first
  for (const wordId of wordIds) {
    await getOrCreateProgress(user.id, wordId);
  }

  const { error } = await supabase
    .from("user_word_progress")
    .update({ seen: true })
    .eq("user_id", user.id)
    .in("word_id", wordIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Niveau groups for filtering
const NIVEAU_GROUPS: Record<string, string[]> = {
  "A": ["A1", "A2"],
  "B": ["B1", "B2"],
  "C": ["C1", "C2"],
};

const matchesNiveauGroup = (niveau: string | null | undefined, group: string): boolean => {
  if (!niveau) return false;
  const levels = NIVEAU_GROUPS[group];
  if (!levels) return false;
  return levels.includes(niveau.toUpperCase());
};

// Get random seen words for quiz (user-specific progress)
export async function getQuizWords(
  count: number,
  sourceLanguage?: string,
  targetLanguage?: string,
  wordType?: string,
  niveauGroup?: string,
  thema?: string
): Promise<WordWithProgress[]> {
  const wordsWithProgress = await getWordsWithProgress(sourceLanguage, targetLanguage);
  
  // Filter to only seen words
  let seenWords = wordsWithProgress.filter(w => w.seen);
  
  // Filter by word type
  if (wordType && wordType !== "all") {
    seenWords = seenWords.filter(w => w.word_type === wordType);
  }

  // Filter by niveau group (A, B, or C)
  if (niveauGroup && niveauGroup !== "all") {
    seenWords = seenWords.filter(w => matchesNiveauGroup(w.niveau, niveauGroup));
  }

  // Filter by thema
  if (thema && thema !== "all") {
    seenWords = seenWords.filter(w => w.thema === thema);
  }

  // Shuffle and take requested count
  const shuffled = seenWords.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Delete a word
export async function deleteWord(wordId: string): Promise<void> {
  const { error } = await supabase.from("words").delete().eq("id", wordId);

  if (error) {
    throw new Error(error.message);
  }
}

// Get all unique themes from shared words
export async function getAllThemes(): Promise<string[]> {
  const { data, error } = await supabase
    .from("words_secure")
    .select("thema")
    .eq("shared", "Yes")
    .not("thema", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  // Cast to include thema field
  const dataWithThema = data as Array<{ thema?: string | null }>;
  
  // Get unique themes
  const themaSet = new Set<string>();
  dataWithThema.forEach((word) => {
    if (word.thema) {
      themaSet.add(word.thema);
    }
  });

  return Array.from(themaSet).sort();
}
