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

interface AddConjugationFormProps {
  onConjugationAdded: () => void;
}

const PRONOUNS = [
  { key: "ik", label: "ik" },
  { key: "jij", label: "jij" },
  { key: "hij_zij", label: "hij/zij" },
  { key: "wij", label: "wij" },
  { key: "jullie", label: "jullie" },
];

export function AddConjugationForm({ onConjugationAdded }: AddConjugationFormProps) {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shared, setShared] = useState(false);

  const [infinitive, setInfinitive] = useState("");
  const [translation, setTranslation] = useState("");

  const [presentForms, setPresentForms] = useState({
    ik: "",
    jij: "",
    hij_zij: "",
    wij: "",
    jullie: "",
  });

  const [pastForms, setPastForms] = useState({
    ik: "",
    jij: "",
    hij_zij: "",
    wij: "",
    jullie: "",
  });

  const [perfectForms, setPerfectForms] = useState({
    ik: "",
    jij: "",
    hij_zij: "",
    wij: "",
    jullie: "",
  });

  const resetForm = () => {
    setInfinitive("");
    setTranslation("");
    setPresentForms({ ik: "", jij: "", hij_zij: "", wij: "", jullie: "" });
    setPastForms({ ik: "", jij: "", hij_zij: "", wij: "", jullie: "" });
    setPerfectForms({ ik: "", jij: "", hij_zij: "", wij: "", jullie: "" });
    setShared(false);
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

    // Check all forms are filled
    const allPresentFilled = Object.values(presentForms).every((v) => v.trim());
    const allPastFilled = Object.values(pastForms).every((v) => v.trim());
    const allPerfectFilled = Object.values(perfectForms).every((v) => v.trim());

    if (!allPresentFilled || !allPastFilled || !allPerfectFilled) {
      toast({
        title: "Fout",
        description: "Vul alle vervoegingen in",
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
        present_ik: presentForms.ik.trim(),
        present_jij: presentForms.jij.trim(),
        present_hij_zij: presentForms.hij_zij.trim(),
        present_wij: presentForms.wij.trim(),
        present_jullie: presentForms.jullie.trim(),
        past_ik: pastForms.ik.trim(),
        past_jij: pastForms.jij.trim(),
        past_hij_zij: pastForms.hij_zij.trim(),
        past_wij: pastForms.wij.trim(),
        past_jullie: pastForms.jullie.trim(),
        perfect_ik: perfectForms.ik.trim(),
        perfect_jij: perfectForms.jij.trim(),
        perfect_hij_zij: perfectForms.hij_zij.trim(),
        perfect_wij: perfectForms.wij.trim(),
        perfect_jullie: perfectForms.jullie.trim(),
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
              <Label htmlFor="infinitive">Infinitief (NL)</Label>
              <Input
                id="infinitive"
                value={infinitive}
                onChange={(e) => setInfinitive(e.target.value)}
                placeholder="lopen"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="translation">Vertaling (EN)</Label>
              <Input
                id="translation"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="to walk"
                maxLength={100}
              />
            </div>
          </div>

          {/* Present Tense */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tegenwoordige tijd</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRONOUNS.map((p) => (
                <div key={`present-${p.key}`} className="space-y-1">
                  <Label htmlFor={`present-${p.key}`} className="text-xs text-muted-foreground">
                    {p.label}
                  </Label>
                  <Input
                    id={`present-${p.key}`}
                    value={presentForms[p.key as keyof typeof presentForms]}
                    onChange={(e) =>
                      setPresentForms((prev) => ({
                        ...prev,
                        [p.key]: e.target.value,
                      }))
                    }
                    placeholder={`${p.label}...`}
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Past Tense */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Verleden tijd</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRONOUNS.map((p) => (
                <div key={`past-${p.key}`} className="space-y-1">
                  <Label htmlFor={`past-${p.key}`} className="text-xs text-muted-foreground">
                    {p.label}
                  </Label>
                  <Input
                    id={`past-${p.key}`}
                    value={pastForms[p.key as keyof typeof pastForms]}
                    onChange={(e) =>
                      setPastForms((prev) => ({
                        ...prev,
                        [p.key]: e.target.value,
                      }))
                    }
                    placeholder={`${p.label}...`}
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Perfect Tense */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Voltooide tijd</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PRONOUNS.map((p) => (
                <div key={`perfect-${p.key}`} className="space-y-1">
                  <Label htmlFor={`perfect-${p.key}`} className="text-xs text-muted-foreground">
                    {p.label}
                  </Label>
                  <Input
                    id={`perfect-${p.key}`}
                    value={perfectForms[p.key as keyof typeof perfectForms]}
                    onChange={(e) =>
                      setPerfectForms((prev) => ({
                        ...prev,
                        [p.key]: e.target.value,
                      }))
                    }
                    placeholder={`${p.label}...`}
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
          </div>

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
