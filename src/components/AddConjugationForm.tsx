import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addConjugation } from "@/lib/conjugationApi";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AddConjugationFormProps {
  onConjugationAdded: () => void;
}

const PRONOUNS = [
  { key: "ik", label: "ik" },
  { key: "jij", label: "jij" },
  { key: "hij_zij", label: "hij/zij" },
  { key: "wij", label: "wij" },
  { key: "jullie", label: "jullie" },
  { key: "zij", label: "zij" },
];

const TENSES = [
  { key: "present", label: "Presente (tegenwoordige tijd)" },
  { key: "past", label: "Imperfecto (verleden tijd onvoltooid)" },
  { key: "perfect", label: "Perfecto Compuesto (voltooide tijd)" },
  { key: "indefinido", label: "Pretérito Indefinido (verleden tijd voltooid)" },
  { key: "futuro", label: "Futuro Simple (zal-vorm)" },
  { key: "futuro_perfecto", label: "Futuro Perfecto (zal hebben-vorm)" },
  { key: "condicional", label: "Condicional (zou-vorm)" },
  { key: "pluscuamperfecto", label: "Pluscuamperfecto (had-vorm)" },
  { key: "subjuntivo_presente", label: "Subjuntivo Presente" },
  { key: "subjuntivo_imperfecto", label: "Subjuntivo Imperfecto" },
];

type TenseKey = typeof TENSES[number]["key"];
type PronounKey = "ik" | "jij" | "hij_zij" | "wij" | "jullie" | "zij";
type TenseForms = Record<PronounKey, string>;
type AllTenseForms = Record<TenseKey, TenseForms>;

const createEmptyForms = (): TenseForms => ({
  ik: "",
  jij: "",
  hij_zij: "",
  wij: "",
  jullie: "",
  zij: "",
});

const createAllEmptyForms = (): AllTenseForms => {
  const forms: Partial<AllTenseForms> = {};
  TENSES.forEach((tense) => {
    forms[tense.key] = createEmptyForms();
  });
  return forms as AllTenseForms;
};

export function AddConjugationForm({ onConjugationAdded }: AddConjugationFormProps) {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shared, setShared] = useState(false);

  const [infinitive, setInfinitive] = useState("");
  const [translation, setTranslation] = useState("");
  const [allForms, setAllForms] = useState<AllTenseForms>(createAllEmptyForms());

  const resetForm = () => {
    setInfinitive("");
    setTranslation("");
    setAllForms(createAllEmptyForms());
    setShared(false);
  };

  const updateForm = (tense: TenseKey, pronoun: PronounKey, value: string) => {
    setAllForms((prev) => ({
      ...prev,
      [tense]: {
        ...prev[tense],
        [pronoun]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!infinitive.trim() || !translation.trim()) {
      toast({
        title: "Fout",
        description: "Vul het werkwoord en de vertaling in",
        variant: "destructive",
      });
      return;
    }

    // Check at least present tense is filled (basic requirement)
    const presentFilled = Object.values(allForms.present).every((v) => v.trim());
    if (!presentFilled) {
      toast({
        title: "Fout",
        description: "Vul minimaal de presente (tegenwoordige tijd) in",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await addConjugation({
        infinitive: infinitive.trim(),
        translation: translation.trim(),
        source_language: "nl",
        target_language: "en",
        // Present
        present_ik: allForms.present.ik.trim(),
        present_jij: allForms.present.jij.trim(),
        present_hij_zij: allForms.present.hij_zij.trim(),
        present_wij: allForms.present.wij.trim(),
        present_jullie: allForms.present.jullie.trim(),
        present_zij: allForms.present.zij.trim(),
        // Past (Imperfecto)
        past_ik: allForms.past.ik.trim(),
        past_jij: allForms.past.jij.trim(),
        past_hij_zij: allForms.past.hij_zij.trim(),
        past_wij: allForms.past.wij.trim(),
        past_jullie: allForms.past.jullie.trim(),
        past_zij: allForms.past.zij.trim(),
        // Perfect
        perfect_ik: allForms.perfect.ik.trim(),
        perfect_jij: allForms.perfect.jij.trim(),
        perfect_hij_zij: allForms.perfect.hij_zij.trim(),
        perfect_wij: allForms.perfect.wij.trim(),
        perfect_jullie: allForms.perfect.jullie.trim(),
        perfect_zij: allForms.perfect.zij.trim(),
        // Indefinido
        indefinido_ik: allForms.indefinido.ik.trim(),
        indefinido_jij: allForms.indefinido.jij.trim(),
        indefinido_hij_zij: allForms.indefinido.hij_zij.trim(),
        indefinido_wij: allForms.indefinido.wij.trim(),
        indefinido_jullie: allForms.indefinido.jullie.trim(),
        indefinido_zij: allForms.indefinido.zij.trim(),
        // Futuro
        futuro_ik: allForms.futuro.ik.trim(),
        futuro_jij: allForms.futuro.jij.trim(),
        futuro_hij_zij: allForms.futuro.hij_zij.trim(),
        futuro_wij: allForms.futuro.wij.trim(),
        futuro_jullie: allForms.futuro.jullie.trim(),
        futuro_zij: allForms.futuro.zij.trim(),
        // Futuro Perfecto
        futuro_perfecto_ik: allForms.futuro_perfecto.ik.trim(),
        futuro_perfecto_jij: allForms.futuro_perfecto.jij.trim(),
        futuro_perfecto_hij_zij: allForms.futuro_perfecto.hij_zij.trim(),
        futuro_perfecto_wij: allForms.futuro_perfecto.wij.trim(),
        futuro_perfecto_jullie: allForms.futuro_perfecto.jullie.trim(),
        futuro_perfecto_zij: allForms.futuro_perfecto.zij.trim(),
        // Condicional
        condicional_ik: allForms.condicional.ik.trim(),
        condicional_jij: allForms.condicional.jij.trim(),
        condicional_hij_zij: allForms.condicional.hij_zij.trim(),
        condicional_wij: allForms.condicional.wij.trim(),
        condicional_jullie: allForms.condicional.jullie.trim(),
        condicional_zij: allForms.condicional.zij.trim(),
        // Pluscuamperfecto
        pluscuamperfecto_ik: allForms.pluscuamperfecto.ik.trim(),
        pluscuamperfecto_jij: allForms.pluscuamperfecto.jij.trim(),
        pluscuamperfecto_hij_zij: allForms.pluscuamperfecto.hij_zij.trim(),
        pluscuamperfecto_wij: allForms.pluscuamperfecto.wij.trim(),
        pluscuamperfecto_jullie: allForms.pluscuamperfecto.jullie.trim(),
        pluscuamperfecto_zij: allForms.pluscuamperfecto.zij.trim(),
        // Subjuntivo Presente
        subjuntivo_presente_ik: allForms.subjuntivo_presente.ik.trim(),
        subjuntivo_presente_jij: allForms.subjuntivo_presente.jij.trim(),
        subjuntivo_presente_hij_zij: allForms.subjuntivo_presente.hij_zij.trim(),
        subjuntivo_presente_wij: allForms.subjuntivo_presente.wij.trim(),
        subjuntivo_presente_jullie: allForms.subjuntivo_presente.jullie.trim(),
        subjuntivo_presente_zij: allForms.subjuntivo_presente.zij.trim(),
        // Subjuntivo Imperfecto
        subjuntivo_imperfecto_ik: allForms.subjuntivo_imperfecto.ik.trim(),
        subjuntivo_imperfecto_jij: allForms.subjuntivo_imperfecto.jij.trim(),
        subjuntivo_imperfecto_hij_zij: allForms.subjuntivo_imperfecto.hij_zij.trim(),
        subjuntivo_imperfecto_wij: allForms.subjuntivo_imperfecto.wij.trim(),
        subjuntivo_imperfecto_jullie: allForms.subjuntivo_imperfecto.jullie.trim(),
        subjuntivo_imperfecto_zij: allForms.subjuntivo_imperfecto.zij.trim(),
        shared: shared ? "Yes" : "No",
      });

      toast({
        title: "Toegevoegd!",
        description: `Werkwoord "${infinitive}" is toegevoegd`,
      });

      resetForm();
      onConjugationAdded();
    } catch (error) {
      console.error("Failed to add conjugation:", error);
      toast({
        title: "Fout",
        description: "Kon werkwoord niet toevoegen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTenseInputs = (tenseKey: TenseKey) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {PRONOUNS.map((p) => (
        <div key={`${tenseKey}-${p.key}`} className="space-y-1">
          <Label htmlFor={`${tenseKey}-${p.key}`} className="text-xs text-muted-foreground">
            {p.label}
          </Label>
          <Input
            id={`${tenseKey}-${p.key}`}
            value={allForms[tenseKey][p.key as PronounKey]}
            onChange={(e) => updateForm(tenseKey, p.key as PronounKey, e.target.value)}
            placeholder={`${p.label}...`}
            maxLength={100}
          />
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Werkwoord Toevoegen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="infinitive">Infinitief</Label>
              <Input
                id="infinitive"
                value={infinitive}
                onChange={(e) => setInfinitive(e.target.value)}
                placeholder="hablar"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="translation">Vertaling</Label>
              <Input
                id="translation"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="spreken"
                maxLength={100}
              />
            </div>
          </div>

          {/* Tenses in Accordion */}
          <Accordion type="multiple" defaultValue={["present"]} className="w-full">
            {TENSES.map((tense) => (
              <AccordionItem key={tense.key} value={tense.key}>
                <AccordionTrigger className="text-sm font-semibold">
                  {tense.label}
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  {renderTenseInputs(tense.key)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Shared Toggle (Admin only) */}
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Switch id="shared" checked={shared} onCheckedChange={setShared} />
              <Label htmlFor="shared">Delen met alle gebruikers</Label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Toevoegen...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Werkwoord Toevoegen
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}