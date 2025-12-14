import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Shuffle,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getConjugations,
  deleteConjugation,
  markConjugationAsSeen,
  incrementConjugationViewCount,
  VerbConjugationWithProgress,
} from "@/lib/conjugationApi";

interface ConjugationLearnModeProps {
  refreshTrigger: number;
}

type TenseType = "present" | "past" | "perfect";

const PRONOUNS = ["ik", "jij", "hij/zij", "wij", "jullie"];
const TENSE_LABELS: Record<TenseType, string> = {
  present: "Tegenwoordige tijd",
  past: "Verleden tijd",
  perfect: "Voltooide tijd",
};

export function ConjugationLearnMode({ refreshTrigger }: ConjugationLearnModeProps) {
  const [allConjugations, setAllConjugations] = useState<VerbConjugationWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConjugations, setShowConjugations] = useState(false);
  const [selectedTense, setSelectedTense] = useState<TenseType>("present");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const conjugations = useMemo(() => {
    return allConjugations.filter((c) => !c.progress?.seen);
  }, [allConjugations]);

  const currentConjugation = conjugations[currentIndex];

  const loadConjugations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getConjugations("nl", "en");
      setAllConjugations(data);
      setCurrentIndex(0);
      setShowConjugations(false);
    } catch (error) {
      console.error("Failed to load conjugations:", error);
      toast({
        title: "Fout",
        description: "Kon vervoegingen niet laden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConjugations();
  }, [refreshTrigger, loadConjugations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!showConjugations) {
          setShowConjugations(true);
        } else {
          goNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConjugations, currentIndex, conjugations.length]);

  const getConjugationForms = (conj: VerbConjugationWithProgress, tense: TenseType) => {
    const prefix = tense;
    return [
      conj[`${prefix}_ik` as keyof VerbConjugationWithProgress] as string,
      conj[`${prefix}_jij` as keyof VerbConjugationWithProgress] as string,
      conj[`${prefix}_hij_zij` as keyof VerbConjugationWithProgress] as string,
      conj[`${prefix}_wij` as keyof VerbConjugationWithProgress] as string,
      conj[`${prefix}_jullie` as keyof VerbConjugationWithProgress] as string,
    ];
  };

  const goNext = useCallback(() => {
    if (currentIndex < conjugations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowConjugations(false);
    }
  }, [currentIndex, conjugations.length]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowConjugations(false);
    }
  }, [currentIndex]);

  const handleShuffle = useCallback(() => {
    const shuffled = [...allConjugations].sort(() => Math.random() - 0.5);
    setAllConjugations(shuffled);
    setCurrentIndex(0);
    setShowConjugations(false);
    toast({ title: "Geschud!", description: "Vervoegingen zijn door elkaar gegooid" });
  }, [allConjugations, toast]);

  const handleShowConjugations = async () => {
    setShowConjugations(true);
    if (currentConjugation) {
      try {
        await incrementConjugationViewCount(currentConjugation.id);
      } catch (error) {
        console.error("Failed to increment view count:", error);
      }
    }
  };

  const handleMarkAsSeen = async () => {
    if (!currentConjugation) return;
    try {
      await markConjugationAsSeen(currentConjugation.id);
      setAllConjugations((prev) =>
        prev.map((c) =>
          c.id === currentConjugation.id
            ? { ...c, progress: { ...c.progress!, seen: true } }
            : c
        )
      );
      toast({ title: "Geleerd!", description: "Werkwoord gemarkeerd als geleerd" });
      if (currentIndex >= conjugations.length - 1 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      setShowConjugations(false);
    } catch (error) {
      console.error("Failed to mark as seen:", error);
      toast({
        title: "Fout",
        description: "Kon niet markeren als geleerd",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!currentConjugation) return;
    try {
      await deleteConjugation(currentConjugation.id);
      setAllConjugations((prev) => prev.filter((c) => c.id !== currentConjugation.id));
      toast({ title: "Verwijderd", description: "Werkwoord is verwijderd" });
      if (currentIndex >= conjugations.length - 1 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      setShowConjugations(false);
    } catch (error) {
      console.error("Failed to delete conjugation:", error);
      toast({
        title: "Fout",
        description: "Kon werkwoord niet verwijderen",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (conjugations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {allConjugations.length === 0
              ? "Nog geen werkwoorden toegevoegd. Voeg eerst werkwoorden toe!"
              : "Alle werkwoorden geleerd! Goed gedaan! 🎉"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const forms = getConjugationForms(currentConjugation, selectedTense);

  return (
    <div className="space-y-4">
      {/* Tense Selection */}
      <div className="flex justify-center gap-2 flex-wrap">
        {(Object.keys(TENSE_LABELS) as TenseType[]).map((tense) => (
          <Button
            key={tense}
            variant={selectedTense === tense ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedTense(tense);
              setShowConjugations(false);
            }}
          >
            {TENSE_LABELS[tense]}
          </Button>
        ))}
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="text-center">
            <span className="text-2xl font-bold">{currentConjugation.infinitive}</span>
            <span className="block text-sm text-muted-foreground mt-1">
              ({currentConjugation.translation})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!showConjugations ? (
            <Button
              onClick={handleShowConjugations}
              variant="secondary"
              className="w-full h-24 text-lg"
            >
              <Eye className="h-5 w-5 mr-2" />
              Toon {TENSE_LABELS[selectedTense]}
            </Button>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-300">
              {PRONOUNS.map((pronoun, index) => (
                <div
                  key={pronoun}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <span className="font-medium text-muted-foreground w-20">
                    {pronoun}
                  </span>
                  <span className="text-lg font-semibold">{forms[index]}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-2 flex-wrap">
        <Button variant="outline" size="icon" onClick={goPrevious} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleShuffle}>
          <Shuffle className="h-4 w-4" />
        </Button>
        <Button variant="default" size="icon" onClick={handleMarkAsSeen}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={currentIndex >= conjugations.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} / {conjugations.length} te leren
        {allConjugations.length > conjugations.length && (
          <span className="ml-2">
            ({allConjugations.length - conjugations.length} geleerd)
          </span>
        )}
      </div>
    </div>
  );
}
