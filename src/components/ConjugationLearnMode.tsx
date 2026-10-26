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
  Search,
  X,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getConjugations,
  deleteConjugation,
  markConjugationAsSeen,
  incrementConjugationViewCount,
  markTensesAsSeen,
  VerbConjugationWithProgress,
} from "@/lib/conjugationApi";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONJUGATION_TENSE_HELP } from "@/lib/conjugationTenseHelp";
import { useDutchConjugationExamples } from "@/hooks/useDutchConjugationExamples";
import { useIsMobile } from "@/hooks/use-mobile";


interface ConjugationLearnModeProps {
  refreshTrigger: number;
}

type TenseType = 
  | "present" 
  | "past" 
  | "perfect" 
  | "indefinido" 
  | "futuro" 
  | "futuro_perfecto" 
  | "condicional" 
  | "pluscuamperfecto" 
  | "subjuntivo_presente" 
  | "subjuntivo_imperfecto";

const PRONOUNS = ["ik", "jij", "hij/zij", "wij", "jullie", "zij"];
const TENSE_LABELS: Record<TenseType, string> = {
  present: "Presente",
  past: "Imperfecto",
  perfect: "Perfecto",
  indefinido: "Indefinido",
  futuro: "Futuro",
  futuro_perfecto: "Futuro Perf.",
  condicional: "Condicional",
  pluscuamperfecto: "Pluscuamperf.",
  subjuntivo_presente: "Subj. Pres.",
  subjuntivo_imperfecto: "Subj. Imperf.",
};

const ALL_TENSES: TenseType[] = [
  "present",
  "past",
  "perfect",
  "indefinido",
  "futuro",
  "futuro_perfecto",
  "condicional",
  "pluscuamperfecto",
  "subjuntivo_presente",
  "subjuntivo_imperfecto",
];

export function ConjugationLearnMode({ refreshTrigger }: ConjugationLearnModeProps) {
  const { t } = useLanguage();
  const [allConjugations, setAllConjugations] = useState<VerbConjugationWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConjugations, setShowConjugations] = useState(false);
  const [selectedTenses, setSelectedTenses] = useState<TenseType[]>(["present"]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyUnseen, setShowOnlyUnseen] = useState(false);
  const [verbTypeFilter, setVerbTypeFilter] = useState<"all" | "regular" | "irregular">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const maxTenses = isMobile ? 3 : 6;

  const conjugations = useMemo(() => {
    let list = allConjugations;
    if (verbTypeFilter !== "all") {
      list = list.filter((c) => (c.verb_type || "regular") === verbTypeFilter);
    }
    if (showOnlyUnseen) {
      list = list.filter((c) => !c.progress?.seen);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.infinitive.toLowerCase().includes(q) ||
          (c.translation || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allConjugations, showOnlyUnseen, verbTypeFilter, searchQuery]);

  const currentConjugation = conjugations[currentIndex];
  const dutchExamples = useDutchConjugationExamples(currentConjugation?.infinitive, currentConjugation?.translation, showConjugations);

  const loadConjugations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getConjugations("nl", "es");
      setAllConjugations(data);
      setCurrentIndex(0);
      setShowConjugations(false);
    } catch (error) {
      console.error("Failed to load conjugations:", error);
      toast({
        title: t.common_error,
        description: t.common_error,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadConjugations();
  }, [refreshTrigger, loadConjugations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!showConjugations) {
          handleShowConjugations();
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
      conj[`${prefix}_zij` as keyof VerbConjugationWithProgress] as string,
    ];
  };

  const toggleTense = (tense: TenseType) => {
    setSelectedTenses((prev) => {
      if (prev.includes(tense)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== tense);
      } else {
        if (prev.length >= maxTenses) {
          return prev;
        }
        return [...prev, tense];
      }
    });
    setShowConjugations(false);
  };

  const goNext = useCallback(async () => {
    if (currentIndex < conjugations.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setShowConjugations(true);
      // Increment view count for the next conjugation
      const nextConjugation = conjugations[nextIndex];
      if (nextConjugation) {
        try {
          await Promise.all([
            incrementConjugationViewCount(nextConjugation.id),
            markTensesAsSeen(nextConjugation.id, selectedTenses),
          ]);
          setAllConjugations((prev) =>
            prev.map((c) =>
              c.id === nextConjugation.id
                ? { 
                    ...c, 
                    progress: { ...c.progress!, seen: true, view_count: (c.progress?.view_count || 0) + 1 },
                    tenseProgress: [
                      ...(c.tenseProgress || []).filter(tp => !selectedTenses.includes(tp.tense as TenseType)),
                      ...selectedTenses.map(t => ({ tense: t, seen: true })),
                    ],
                  }
                : c
            )
          );
        } catch (error) {
          console.error("Failed to increment view count:", error);
        }
      }
    }
  }, [currentIndex, conjugations, selectedTenses]);

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
  }, [allConjugations]);

  const handleShowConjugations = async () => {
    setShowConjugations(true);
    if (currentConjugation) {
      try {
        await Promise.all([
          incrementConjugationViewCount(currentConjugation.id),
          markTensesAsSeen(currentConjugation.id, selectedTenses),
        ]);
        // Update local state to mark as seen
        setAllConjugations((prev) =>
          prev.map((c) =>
            c.id === currentConjugation.id
              ? { 
                  ...c, 
                  progress: { ...c.progress!, seen: true, view_count: (c.progress?.view_count || 0) + 1 },
                  tenseProgress: [
                    ...(c.tenseProgress || []).filter(tp => !selectedTenses.includes(tp.tense as TenseType)),
                    ...selectedTenses.map(t => ({ tense: t, seen: true })),
                  ],
                }
              : c
          )
        );
      } catch (error) {
        console.error("Failed to increment view count:", error);
      }
    }
  };

  const handleMarkAsSeenAndNext = async () => {
    if (!currentConjugation) return;
    try {
      await Promise.all([
        markConjugationAsSeen(currentConjugation.id),
        markTensesAsSeen(currentConjugation.id, selectedTenses),
      ]);
      setAllConjugations((prev) =>
        prev.map((c) =>
          c.id === currentConjugation.id
            ? { 
                ...c, 
                progress: { ...c.progress!, seen: true },
                tenseProgress: [
                  ...(c.tenseProgress || []).filter(tp => !selectedTenses.includes(tp.tense as TenseType)),
                  ...selectedTenses.map(t => ({ tense: t, seen: true })),
                ],
              }
            : c
        )
      );
      // Go to next word and show conjugations
      if (currentIndex < conjugations.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setShowConjugations(true);
        // Also mark next conjugation view
        const nextConjugation = conjugations[nextIndex];
        if (nextConjugation) {
          await incrementConjugationViewCount(nextConjugation.id);
        }
      } else {
        setShowConjugations(false);
      }
    } catch (error) {
      console.error("Failed to mark as seen:", error);
      toast({
        title: t.common_error,
        description: t.common_error,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!currentConjugation) return;
    try {
      await deleteConjugation(currentConjugation.id);
      setAllConjugations((prev) => prev.filter((c) => c.id !== currentConjugation.id));
      if (currentIndex >= conjugations.length - 1 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      setShowConjugations(false);
    } catch (error) {
      console.error("Failed to delete conjugation:", error);
      toast({
        title: t.common_error,
        description: t.common_error,
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

  if (allConjugations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t.learn_no_words}</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-4">
      {/* Tense Selection with Checkboxes */}
      <Card>
        <CardContent className="p-4">
          <div className="relative mb-3 max-w-md mx-auto">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
                setShowConjugations(false);
              }}
              placeholder="Zoek werkwoord (bv. abusar)..."
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentIndex(0);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Wis zoekopdracht"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {t.common_filter}:
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {(["all", "regular", "irregular"] as const).map((v) => (
                  <Button
                    key={v}
                    type="button"
                    size="sm"
                    variant={verbTypeFilter === v ? "default" : "outline"}
                    onClick={() => {
                      setVerbTypeFilter(v);
                      setCurrentIndex(0);
                      setShowConjugations(false);
                    }}
                  >
                    {v === "all" ? "Alle" : v === "regular" ? "Regelmatig" : "Onregelmatig"}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Alleen nieuwe</span>
                <Switch
                  checked={showOnlyUnseen}
                  onCheckedChange={(checked) => {
                    setShowOnlyUnseen(checked);
                    setCurrentIndex(0);
                    setShowConjugations(false);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {ALL_TENSES.map((tense) => (
              <label
                key={tense}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTenses.includes(tense)
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                }`}
              >
                <Checkbox
                  checked={selectedTenses.includes(tense)}
                  onCheckedChange={() => toggleTense(tense)}
                />
                <span className="text-xs font-medium">{TENSE_LABELS[tense]}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Card */}
      {!currentConjugation ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Geen werkwoorden gevonden.
          </CardContent>
        </Card>
      ) : (
      <>
      <Card className="overflow-hidden">

        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="text-center">
            <span className="text-2xl font-bold">{currentConjugation.infinitive}</span>
            <span className="block text-sm text-muted-foreground mt-1">
              ({currentConjugation.translation})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {!showConjugations ? (
            <Button
              onClick={handleShowConjugations}
              variant="secondary"
              className="w-full h-24 text-lg"
            >
              <Eye className="h-5 w-5 mr-2" />
              {t.learn_show_translation}
            </Button>
          ) : (
            <div className="animate-in fade-in duration-300 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground"></th>
                    {selectedTenses.map((tense) => (
                      <th key={tense} className="text-left p-2 font-medium text-primary">
                        <div className="flex items-center gap-1">
                          <span>{TENSE_LABELS[tense]}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                aria-label={`Uitleg ${TENSE_LABELS[tense]}`}
                                title={`Uitleg ${TENSE_LABELS[tense]}`}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="max-w-[calc(100vw-2rem)] text-sm font-normal" side="bottom">
                              {CONJUGATION_TENSE_HELP[tense].explanation}
                              {dutchExamples.data && <p className="mt-2 font-medium">{dutchExamples.data[tense]}</p>}
                            </PopoverContent>
                          </Popover>
                        </div>
                        <span className="block text-xs font-normal text-muted-foreground">
                          {dutchExamples.data ? dutchExamples.data[tense] : dutchExamples.isError ? "Voorbeeld niet beschikbaar" : "Voorbeeld laden…"}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRONOUNS.map((pronoun, idx) => (
                    <tr key={pronoun} className="border-b last:border-0">
                      <td className="p-2 font-medium text-muted-foreground">{pronoun}</td>
                      {selectedTenses.map((tense) => {
                        const forms = getConjugationForms(currentConjugation, tense);
                        return (
                          <td key={tense} className="p-2 font-semibold">
                            {forms[idx] || "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {dutchExamples.isError && (
                <Button variant="ghost" size="sm" onClick={() => dutchExamples.refetch()}>
                  Nederlandse voorbeelden opnieuw laden
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-2 flex-wrap">
        <Button variant="outline" size="icon" onClick={goPrevious} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleShuffle} title={t.learn_shuffle}>
          <Shuffle className="h-4 w-4" />
        </Button>
        <Button variant="default" size="icon" onClick={handleMarkAsSeenAndNext} title={t.learn_learned}>
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon" onClick={handleDelete} title={t.common_delete}>
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
        {currentIndex + 1} / {conjugations.length}
        {allConjugations.length > conjugations.length && (
          <span className="ml-2">
            ({allConjugations.length - conjugations.length} {t.learn_learned})
          </span>
        )}
      </div>
      </>
      )}
    </div>

  );
}
