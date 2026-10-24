import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  present: z.string().min(1), past: z.string().min(1), perfect: z.string().min(1), indefinido: z.string().min(1),
  futuro: z.string().min(1), futuro_perfecto: z.string().min(1), condicional: z.string().min(1),
  pluscuamperfecto: z.string().min(1), subjuntivo_presente: z.string().min(1), subjuntivo_imperfecto: z.string().min(1),
});

export function useDutchConjugationExamples(infinitive: string | undefined, translation: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["dutch-conjugation-examples", infinitive, translation],
    enabled: enabled && Boolean(infinitive && translation),
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Log opnieuw in om voorbeelden te laden.");
      const { data, error } = await supabase.functions.invoke("dutch-conjugation-examples", {
        body: { infinitive, translation }, headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || data?.error) throw new Error(data?.error || "Nederlandse voorbeelden konden niet worden geladen.");
      return schema.parse(data?.examples);
    },
  });
}