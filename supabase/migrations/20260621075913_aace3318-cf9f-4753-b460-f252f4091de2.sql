
-- Add verb_type column to distinguish regular vs irregular verbs
ALTER TABLE public.verb_conjugations
  ADD COLUMN IF NOT EXISTS verb_type text NOT NULL DEFAULT 'regular'
  CHECK (verb_type IN ('regular', 'irregular'));

-- Recreate secure view with new column
DROP VIEW IF EXISTS public.verb_conjugations_secure;
CREATE VIEW public.verb_conjugations_secure
WITH (security_invoker = true) AS
SELECT id, infinitive, translation, source_language, target_language,
  CASE WHEN user_id = auth.uid() THEN user_id ELSE NULL::uuid END AS user_id,
  shared, verb_type, created_at, updated_at,
  present_ik, present_jij, present_hij_zij, present_wij, present_jullie, present_zij,
  past_ik, past_jij, past_hij_zij, past_wij, past_jullie, past_zij,
  perfect_ik, perfect_jij, perfect_hij_zij, perfect_wij, perfect_jullie, perfect_zij,
  indefinido_ik, indefinido_jij, indefinido_hij_zij, indefinido_wij, indefinido_jullie, indefinido_zij,
  futuro_ik, futuro_jij, futuro_hij_zij, futuro_wij, futuro_jullie, futuro_zij,
  futuro_perfecto_ik, futuro_perfecto_jij, futuro_perfecto_hij_zij, futuro_perfecto_wij, futuro_perfecto_jullie, futuro_perfecto_zij,
  condicional_ik, condicional_jij, condicional_hij_zij, condicional_wij, condicional_jullie, condicional_zij,
  pluscuamperfecto_ik, pluscuamperfecto_jij, pluscuamperfecto_hij_zij, pluscuamperfecto_wij, pluscuamperfecto_jullie, pluscuamperfecto_zij,
  subjuntivo_presente_ik, subjuntivo_presente_jij, subjuntivo_presente_hij_zij, subjuntivo_presente_wij, subjuntivo_presente_jullie, subjuntivo_presente_zij,
  subjuntivo_imperfecto_ik, subjuntivo_imperfecto_jij, subjuntivo_imperfecto_hij_zij, subjuntivo_imperfecto_wij, subjuntivo_imperfecto_jullie, subjuntivo_imperfecto_zij
FROM public.verb_conjugations c
WHERE shared = 'Yes'::text OR user_id = auth.uid();

GRANT SELECT ON public.verb_conjugations_secure TO authenticated;
