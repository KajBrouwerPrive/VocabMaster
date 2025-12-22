import { supabase } from "@/integrations/supabase/client";

export interface VerbConjugation {
  id: string;
  user_id: string | null;
  infinitive: string;
  translation: string;
  source_language: string;
  target_language: string;
  // Presente (tegenwoordige tijd)
  present_ik: string;
  present_jij: string;
  present_hij_zij: string;
  present_wij: string;
  present_jullie: string;
  // Imperfecto (verleden tijd onvoltooid)
  past_ik: string;
  past_jij: string;
  past_hij_zij: string;
  past_wij: string;
  past_jullie: string;
  // Perfecto compuesto (voltooide tijd)
  perfect_ik: string;
  perfect_jij: string;
  perfect_hij_zij: string;
  perfect_wij: string;
  perfect_jullie: string;
  // Pretérito indefinido (verleden tijd voltooid)
  indefinido_ik: string;
  indefinido_jij: string;
  indefinido_hij_zij: string;
  indefinido_wij: string;
  indefinido_jullie: string;
  // Futuro simple (zal-vorm)
  futuro_ik: string;
  futuro_jij: string;
  futuro_hij_zij: string;
  futuro_wij: string;
  futuro_jullie: string;
  // Futuro perfecto (zal hebben-vorm)
  futuro_perfecto_ik: string;
  futuro_perfecto_jij: string;
  futuro_perfecto_hij_zij: string;
  futuro_perfecto_wij: string;
  futuro_perfecto_jullie: string;
  // Condicional (zou-vorm)
  condicional_ik: string;
  condicional_jij: string;
  condicional_hij_zij: string;
  condicional_wij: string;
  condicional_jullie: string;
  // Pluscuamperfecto (had-vorm)
  pluscuamperfecto_ik: string;
  pluscuamperfecto_jij: string;
  pluscuamperfecto_hij_zij: string;
  pluscuamperfecto_wij: string;
  pluscuamperfecto_jullie: string;
  // Subjuntivo presente
  subjuntivo_presente_ik: string;
  subjuntivo_presente_jij: string;
  subjuntivo_presente_hij_zij: string;
  subjuntivo_presente_wij: string;
  subjuntivo_presente_jullie: string;
  // Subjuntivo imperfecto
  subjuntivo_imperfecto_ik: string;
  subjuntivo_imperfecto_jij: string;
  subjuntivo_imperfecto_hij_zij: string;
  subjuntivo_imperfecto_wij: string;
  subjuntivo_imperfecto_jullie: string;
  shared: string;
  created_at: string;
  updated_at: string;
}

export interface ConjugationProgress {
  id: string;
  user_id: string;
  conjugation_id: string;
  seen: boolean;
  view_count: number;
  quiz_view_count: number;
  incorrect_count: number;
}

export interface VerbConjugationWithProgress extends VerbConjugation {
  progress?: ConjugationProgress;
}

export async function getConjugations(
  sourceLanguage?: string,
  targetLanguage?: string
): Promise<VerbConjugationWithProgress[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User not authenticated");

  let query = supabase.from("verb_conjugations_secure").select("*");

  if (sourceLanguage) {
    query = query.eq("source_language", sourceLanguage);
  }
  if (targetLanguage) {
    query = query.eq("target_language", targetLanguage);
  }

  const { data: conjugations, error } = await query;
  if (error) throw error;

  // Get user progress
  const { data: progressData } = await supabase
    .from("user_conjugation_progress")
    .select("*")
    .eq("user_id", userData.user.id);

  const progressMap = new Map(
    progressData?.map((p) => [p.conjugation_id, p]) || []
  );

  return (conjugations || []).map((conj) => ({
    ...conj,
    progress: progressMap.get(conj.id),
  }));
}

export async function addConjugation(
  conjugation: Omit<VerbConjugation, "id" | "user_id" | "created_at" | "updated_at">
): Promise<VerbConjugation> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User not authenticated");

  // Check if user is admin for shared words
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  const isAdmin = !!roleData;
  const userId = conjugation.shared === "Yes" && isAdmin ? null : userData.user.id;

  const { data, error } = await supabase
    .from("verb_conjugations")
    .insert({
      ...conjugation,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConjugation(conjugationId: string): Promise<void> {
  const { error } = await supabase
    .from("verb_conjugations")
    .delete()
    .eq("id", conjugationId);

  if (error) throw error;
}

export async function markConjugationAsSeen(conjugationId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User not authenticated");

  await supabase.from("user_conjugation_progress").upsert(
    {
      user_id: userData.user.id,
      conjugation_id: conjugationId,
      seen: true,
    },
    {
      onConflict: "user_id,conjugation_id",
    }
  );
}

export async function incrementConjugationViewCount(conjugationId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User not authenticated");

  // Get current progress or create new
  const { data: existing } = await supabase
    .from("user_conjugation_progress")
    .select("view_count")
    .eq("user_id", userData.user.id)
    .eq("conjugation_id", conjugationId)
    .maybeSingle();

  await supabase.from("user_conjugation_progress").upsert(
    {
      user_id: userData.user.id,
      conjugation_id: conjugationId,
      view_count: (existing?.view_count || 0) + 1,
    },
    {
      onConflict: "user_id,conjugation_id",
    }
  );
}
