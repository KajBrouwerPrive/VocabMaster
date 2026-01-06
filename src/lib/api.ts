import { supabase } from "@/integrations/supabase/client";

export interface Word {
  id: string;
  source_word: string;
  source_language: string;
  translation: string;
  target_language: string;
  word_type: string | null;
  niveau: string | null;
  thema: string | null; // Resolved from theme_id via get_words_with_shared
  theme_id: string | null;
  context: string | null;
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

export interface QuizResultData {
  quiz_type: 'words' | 'conjugations';
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  niveau?: string | null;
  thema?: string | null;
  tenses?: string[] | null;
  ignore_accents?: boolean;
}

export interface QuizResultRecord extends QuizResultData {
  id: string;
  user_id: string;
  created_at: string;
  ignore_accents: boolean;
}

// Save quiz result to database
export async function saveQuizResult(result: QuizResultData): Promise<QuizResultRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  const { data, error } = await supabase
    .from("quiz_results")
    .insert({
      user_id: user.id,
      quiz_type: result.quiz_type,
      score_percentage: result.score_percentage,
      total_questions: result.total_questions,
      correct_answers: result.correct_answers,
      niveau: result.niveau || null,
      thema: result.thema || null,
      tenses: result.tenses || null,
      ignore_accents: result.ignore_accents ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as QuizResultRecord;
}

// Get quiz results for current user
export async function getQuizResults(limit?: number): Promise<QuizResultRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn");

  let query = supabase
    .from("quiz_results")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as QuizResultRecord[];
}

// Get quiz statistics for current user
export async function getQuizStatistics(): Promise<{
  totalQuizzes: number;
  above80Count: number;
  above90Count: number;
  perfectCount: number;
  averageScore: number;
}> {
  const results = await getQuizResults();
  
  // Only quizzes with 10+ questions count for bronze/silver/gold
  const qualifyingResults = results.filter(r => r.total_questions >= 10);
  
  const totalQuizzes = results.length;
  // Exclusive counting: bronze 80-89%, silver 90-99%, gold 100%
  const perfectCount = qualifyingResults.filter(r => r.score_percentage === 100).length;
  const above90Count = qualifyingResults.filter(r => r.score_percentage >= 90 && r.score_percentage < 100).length;
  const above80Count = qualifyingResults.filter(r => r.score_percentage >= 80 && r.score_percentage < 90).length;
  const averageScore = totalQuizzes > 0 
    ? results.reduce((sum, r) => sum + Number(r.score_percentage), 0) / totalQuizzes 
    : 0;

  return {
    totalQuizzes,
    above80Count,
    above90Count,
    perfectCount,
    averageScore: Math.round(averageScore),
  };
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
  // Get the current session to use the user's JWT token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error("Je moet ingelogd zijn om suggesties op te halen");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-words`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
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
  wordType?: string,
  niveau?: string,
  context?: string,
  themeId?: string
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
      niveau: niveau || null,
      context: context || null,
      theme_id: themeId || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Dit woord bestaat al");
    }
    throw new Error(error.message);
  }

  return {
    ...data,
    thema: null, // Will be resolved via theme_id
  };
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

  return (data || []).map(d => ({
    ...d,
    thema: null, // Will be resolved via theme_id
  }));
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

  // Note: RPC calls are capped at 1000 rows per request; paginate to load everything.
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 200; // safety cap

  const allWordsFromRpc: any[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .rpc("get_words_with_shared")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    const chunk = data || [];
    allWordsFromRpc.push(...chunk);

    if (chunk.length < PAGE_SIZE) break;
  }

  // Filter by language if specified
  let filteredWords = allWordsFromRpc;
  if (sourceLanguage) {
    filteredWords = filteredWords.filter((w) => w.source_language === sourceLanguage);
  }
  if (targetLanguage) {
    filteredWords = filteredWords.filter((w) => w.target_language === targetLanguage);
  }

  // Cast to include context field that exists in database
  const wordsWithExtras = filteredWords as Array<(typeof filteredWords)[number] & { context?: string | null }>;

  // Get all user progress (paginate; can exceed 1000 rows)
  const allProgress: UserWordProgress[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("user_word_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    const chunk = (data || []) as UserWordProgress[];
    allProgress.push(...chunk);

    if (chunk.length < PAGE_SIZE) break;
  }

  const progressMap = new Map<string, UserWordProgress>();
  allProgress.forEach((p) => {
    progressMap.set(p.word_id, p);
  });

  // Merge words with progress
  return wordsWithExtras.map((word) => {
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
      theme_id: word.theme_id ?? null,
      context: word.context ?? null,
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
  let query = supabase.from("words_secure").select("*").order("created_at", { ascending: false }).range(0, 49999);

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

  // Cast to include theme_id field that exists in database but not in generated types
  const dataWithExtras = data as Array<typeof data[number] & { theme_id?: string | null }>;

  return dataWithExtras.map((word) => ({
    id: word.id!,
    source_word: word.source_word!,
    source_language: word.source_language!,
    translation: word.translation!,
    target_language: word.target_language!,
    word_type: word.word_type ?? null,
    niveau: word.niveau ?? null,
    thema: null, // Not available from words_secure, use get_words_with_shared for thema
    theme_id: word.theme_id ?? null,
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

const matchesNiveauGroup = (word: WordWithProgress, group: string): boolean => {
  if (group === "difficult") {
    return (word.incorrect_count - (word.correct_count || 0)) > 2;
  }
  if (!word.niveau) return false;
  const levels = NIVEAU_GROUPS[group];
  if (!levels) return false;
  return levels.includes(word.niveau.toUpperCase());
};

// Check if word matches any of the selected niveau groups
export const matchesNiveauGroups = (word: WordWithProgress, selectedGroups: string[]): boolean => {
  if (selectedGroups.length === 0) return true;
  return selectedGroups.some(group => matchesNiveauGroup(word, group));
};

// Check if word matches any of the selected themes
export const matchesThemas = (word: WordWithProgress, selectedThemas: string[]): boolean => {
  if (selectedThemas.length === 0) return true;
  return word.thema ? selectedThemas.includes(word.thema) : false;
};

// Get random seen words for quiz (user-specific progress)
export async function getQuizWords(
  count: number,
  sourceLanguage?: string,
  targetLanguage?: string,
  wordType?: string,
  niveauGroups?: string[],
  themas?: string[]
): Promise<WordWithProgress[]> {
  const wordsWithProgress = await getWordsWithProgress(sourceLanguage, targetLanguage);
  
  // Filter to only seen words
  let seenWords = wordsWithProgress.filter(w => w.seen);
  
  // Filter by word type
  if (wordType && wordType !== "all") {
    seenWords = seenWords.filter(w => w.word_type === wordType);
  }

  // Filter by niveau groups (multi-select)
  if (niveauGroups && niveauGroups.length > 0) {
    seenWords = seenWords.filter(w => matchesNiveauGroups(w, niveauGroups));
  }

  // Filter by themes (multi-select)
  if (themas && themas.length > 0) {
    seenWords = seenWords.filter(w => matchesThemas(w, themas));
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

// Theme interface
export interface Theme {
  id: string;
  name: string;
  created_at: string;
}

// Get all themes from themes table
export async function getAllThemes(): Promise<string[]> {
  const { data, error } = await supabase
    .from("themes")
    .select("name")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((t) => t.name);
}

// Get all themes with full data
export async function getThemes(): Promise<Theme[]> {
  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

// Add a new theme (admin only)
export async function addTheme(name: string): Promise<Theme> {
  const { data, error } = await supabase
    .from("themes")
    .insert({ name: name.toLowerCase() })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Dit thema bestaat al");
    }
    throw new Error(error.message);
  }

  return data;
}

// Update a theme (admin only)
export async function updateTheme(id: string, name: string): Promise<Theme> {
  const { data, error } = await supabase
    .from("themes")
    .update({ name: name.toLowerCase() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Dit thema bestaat al");
    }
    throw new Error(error.message);
  }

  return data;
}

// Delete a theme (admin only)
export async function deleteTheme(id: string): Promise<void> {
  const { error } = await supabase
    .from("themes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
