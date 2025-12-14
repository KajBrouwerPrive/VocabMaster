-- Add new tense columns to verb_conjugations table
-- Pretérito indefinido (verleden tijd voltooid)
ALTER TABLE public.verb_conjugations ADD COLUMN indefinido_ik text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN indefinido_jij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN indefinido_hij_zij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN indefinido_wij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN indefinido_jullie text NOT NULL DEFAULT '';

-- Futuro simple (zal-vorm)
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_ik text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_jij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_hij_zij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_wij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_jullie text NOT NULL DEFAULT '';

-- Futuro perfecto (zal hebben-vorm)
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_perfecto_ik text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_perfecto_jij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_perfecto_hij_zij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_perfecto_wij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN futuro_perfecto_jullie text NOT NULL DEFAULT '';

-- Condicional (zou-vorm)
ALTER TABLE public.verb_conjugations ADD COLUMN condicional_ik text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN condicional_jij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN condicional_hij_zij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN condicional_wij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN condicional_jullie text NOT NULL DEFAULT '';

-- Pluscuamperfecto (had-vorm)
ALTER TABLE public.verb_conjugations ADD COLUMN pluscuamperfecto_ik text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN pluscuamperfecto_jij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN pluscuamperfecto_hij_zij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN pluscuamperfecto_wij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN pluscuamperfecto_jullie text NOT NULL DEFAULT '';

-- Subjuntivo presente
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_presente_ik text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_presente_jij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_presente_hij_zij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_presente_wij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_presente_jullie text NOT NULL DEFAULT '';

-- Subjuntivo imperfecto
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_imperfecto_ik text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_imperfecto_jij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_imperfecto_hij_zij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_imperfecto_wij text NOT NULL DEFAULT '';
ALTER TABLE public.verb_conjugations ADD COLUMN subjuntivo_imperfecto_jullie text NOT NULL DEFAULT '';