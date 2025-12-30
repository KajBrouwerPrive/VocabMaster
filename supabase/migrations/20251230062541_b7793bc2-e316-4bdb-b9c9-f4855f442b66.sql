-- First drop the view that depends on the function
DROP VIEW IF EXISTS public.verb_conjugations_secure;

-- Now drop and recreate the function
DROP FUNCTION IF EXISTS public.get_conjugations_secure();

-- Add zij (plural they) columns for all tenses (if not already added)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verb_conjugations' AND column_name = 'present_zij') THEN
    ALTER TABLE public.verb_conjugations
    ADD COLUMN present_zij text NOT NULL DEFAULT '',
    ADD COLUMN past_zij text NOT NULL DEFAULT '',
    ADD COLUMN perfect_zij text NOT NULL DEFAULT '',
    ADD COLUMN indefinido_zij text NOT NULL DEFAULT '',
    ADD COLUMN futuro_zij text NOT NULL DEFAULT '',
    ADD COLUMN futuro_perfecto_zij text NOT NULL DEFAULT '',
    ADD COLUMN condicional_zij text NOT NULL DEFAULT '',
    ADD COLUMN pluscuamperfecto_zij text NOT NULL DEFAULT '',
    ADD COLUMN subjuntivo_presente_zij text NOT NULL DEFAULT '',
    ADD COLUMN subjuntivo_imperfecto_zij text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Recreate the function with zij columns
CREATE OR REPLACE FUNCTION public.get_conjugations_secure()
 RETURNS TABLE(id uuid, infinitive text, translation text, source_language text, target_language text, user_id uuid, shared text, created_at timestamp with time zone, updated_at timestamp with time zone, present_ik text, present_jij text, present_hij_zij text, present_wij text, present_jullie text, present_zij text, past_ik text, past_jij text, past_hij_zij text, past_wij text, past_jullie text, past_zij text, perfect_ik text, perfect_jij text, perfect_hij_zij text, perfect_wij text, perfect_jullie text, perfect_zij text, indefinido_ik text, indefinido_jij text, indefinido_hij_zij text, indefinido_wij text, indefinido_jullie text, indefinido_zij text, futuro_ik text, futuro_jij text, futuro_hij_zij text, futuro_wij text, futuro_jullie text, futuro_zij text, futuro_perfecto_ik text, futuro_perfecto_jij text, futuro_perfecto_hij_zij text, futuro_perfecto_wij text, futuro_perfecto_jullie text, futuro_perfecto_zij text, condicional_ik text, condicional_jij text, condicional_hij_zij text, condicional_wij text, condicional_jullie text, condicional_zij text, pluscuamperfecto_ik text, pluscuamperfecto_jij text, pluscuamperfecto_hij_zij text, pluscuamperfecto_wij text, pluscuamperfecto_jullie text, pluscuamperfecto_zij text, subjuntivo_presente_ik text, subjuntivo_presente_jij text, subjuntivo_presente_hij_zij text, subjuntivo_presente_wij text, subjuntivo_presente_jullie text, subjuntivo_presente_zij text, subjuntivo_imperfecto_ik text, subjuntivo_imperfecto_jij text, subjuntivo_imperfecto_hij_zij text, subjuntivo_imperfecto_wij text, subjuntivo_imperfecto_jullie text, subjuntivo_imperfecto_zij text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.id,
    c.infinitive,
    c.translation,
    c.source_language,
    c.target_language,
    CASE 
      WHEN c.user_id = auth.uid() THEN c.user_id
      ELSE NULL
    END as user_id,
    c.shared,
    c.created_at,
    c.updated_at,
    c.present_ik,
    c.present_jij,
    c.present_hij_zij,
    c.present_wij,
    c.present_jullie,
    c.present_zij,
    c.past_ik,
    c.past_jij,
    c.past_hij_zij,
    c.past_wij,
    c.past_jullie,
    c.past_zij,
    c.perfect_ik,
    c.perfect_jij,
    c.perfect_hij_zij,
    c.perfect_wij,
    c.perfect_jullie,
    c.perfect_zij,
    c.indefinido_ik,
    c.indefinido_jij,
    c.indefinido_hij_zij,
    c.indefinido_wij,
    c.indefinido_jullie,
    c.indefinido_zij,
    c.futuro_ik,
    c.futuro_jij,
    c.futuro_hij_zij,
    c.futuro_wij,
    c.futuro_jullie,
    c.futuro_zij,
    c.futuro_perfecto_ik,
    c.futuro_perfecto_jij,
    c.futuro_perfecto_hij_zij,
    c.futuro_perfecto_wij,
    c.futuro_perfecto_jullie,
    c.futuro_perfecto_zij,
    c.condicional_ik,
    c.condicional_jij,
    c.condicional_hij_zij,
    c.condicional_wij,
    c.condicional_jullie,
    c.condicional_zij,
    c.pluscuamperfecto_ik,
    c.pluscuamperfecto_jij,
    c.pluscuamperfecto_hij_zij,
    c.pluscuamperfecto_wij,
    c.pluscuamperfecto_jullie,
    c.pluscuamperfecto_zij,
    c.subjuntivo_presente_ik,
    c.subjuntivo_presente_jij,
    c.subjuntivo_presente_hij_zij,
    c.subjuntivo_presente_wij,
    c.subjuntivo_presente_jullie,
    c.subjuntivo_presente_zij,
    c.subjuntivo_imperfecto_ik,
    c.subjuntivo_imperfecto_jij,
    c.subjuntivo_imperfecto_hij_zij,
    c.subjuntivo_imperfecto_wij,
    c.subjuntivo_imperfecto_jullie,
    c.subjuntivo_imperfecto_zij
  FROM public.verb_conjugations c
  WHERE c.shared = 'Yes' OR c.user_id = auth.uid()
$function$;

-- Recreate the view with zij columns
CREATE VIEW public.verb_conjugations_secure AS
SELECT 
    c.id,
    c.infinitive,
    c.translation,
    c.source_language,
    c.target_language,
    CASE 
      WHEN c.user_id = auth.uid() THEN c.user_id
      ELSE NULL
    END as user_id,
    c.shared,
    c.created_at,
    c.updated_at,
    c.present_ik,
    c.present_jij,
    c.present_hij_zij,
    c.present_wij,
    c.present_jullie,
    c.present_zij,
    c.past_ik,
    c.past_jij,
    c.past_hij_zij,
    c.past_wij,
    c.past_jullie,
    c.past_zij,
    c.perfect_ik,
    c.perfect_jij,
    c.perfect_hij_zij,
    c.perfect_wij,
    c.perfect_jullie,
    c.perfect_zij,
    c.indefinido_ik,
    c.indefinido_jij,
    c.indefinido_hij_zij,
    c.indefinido_wij,
    c.indefinido_jullie,
    c.indefinido_zij,
    c.futuro_ik,
    c.futuro_jij,
    c.futuro_hij_zij,
    c.futuro_wij,
    c.futuro_jullie,
    c.futuro_zij,
    c.futuro_perfecto_ik,
    c.futuro_perfecto_jij,
    c.futuro_perfecto_hij_zij,
    c.futuro_perfecto_wij,
    c.futuro_perfecto_jullie,
    c.futuro_perfecto_zij,
    c.condicional_ik,
    c.condicional_jij,
    c.condicional_hij_zij,
    c.condicional_wij,
    c.condicional_jullie,
    c.condicional_zij,
    c.pluscuamperfecto_ik,
    c.pluscuamperfecto_jij,
    c.pluscuamperfecto_hij_zij,
    c.pluscuamperfecto_wij,
    c.pluscuamperfecto_jullie,
    c.pluscuamperfecto_zij,
    c.subjuntivo_presente_ik,
    c.subjuntivo_presente_jij,
    c.subjuntivo_presente_hij_zij,
    c.subjuntivo_presente_wij,
    c.subjuntivo_presente_jullie,
    c.subjuntivo_presente_zij,
    c.subjuntivo_imperfecto_ik,
    c.subjuntivo_imperfecto_jij,
    c.subjuntivo_imperfecto_hij_zij,
    c.subjuntivo_imperfecto_wij,
    c.subjuntivo_imperfecto_jullie,
    c.subjuntivo_imperfecto_zij
FROM public.verb_conjugations c
WHERE c.shared = 'Yes' OR c.user_id = auth.uid();