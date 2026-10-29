import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
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
  MoreHorizontal,
  SlidersHorizontal,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { readStoredList, writeStoredList } from "@/lib/storedSelection";
import { useLearnShortcuts } from "@/hooks/useLearnShortcuts";
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

// Keeps the shown columns in the same order as the selection grid.
const TENSE_ORDER = new Map<TenseType, number>(ALL_TENSES.map((tense, i) => [tense, i]));
const sortTenses = (tenses: TenseType[]) =>
  [...tenses].sort((a, b) => TENSE_ORDER.get(a)! - TENSE_ORDER.get(b)!);

const SELECTED_TENSES_STORAGE_KEY = "vocabmaster.conjugations.selectedTenses";
const MAX_TENSES_DESKTOP = 6;
const MAX_TENSES_MOBILE = 3;
const DEFAULT_TENSES: TenseType[] = ["present"];
const ROUND_ICON_BUTTON = "h-12 w-12 rounded-[14px] p-0 [&_svg]:size-5";
const SEGMENT_BUTTON = "h-8 rounded-lg px-3.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const segmentState = (isActive: boolean) =>
  isActive ? "bg-primary text-primary-foreground font-semibold" : "text-foreground font-medium hover:bg-card";


export function ConjugationLearnMode({ refreshTrigger }: ConjugationLearnModeProps) {
  const { t } = useLanguage();
  const [allConjugations, setAllConjugations] = useState<VerbConjugationWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConjugations, setShowConjugations] = useState(false);
  const [selectedTenses, setSelectedTenses] = useState<TenseType[]>(
    () => readStoredList(SELECTED_TENSES_STORAGE_KEY, ALL_TENSES, MAX_TENSES_DESKTOP) ?? DEFAULT_TENSES
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenseOrderMode, setTenseOrderMode] = useState<"standard" | "click">("standard");

  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyUnseen, setShowOnlyUnseen] = useState(false);
  const [verbTypeFilter, setVerbTypeFilter] = useState<"all" | "regular" | "irregular">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const maxTenses = isMobile ? MAX_TENSES_MOBILE : MAX_TENSES_DESKTOP;

  useEffect(() => {
    writeStoredList(SELECTED_TENSES_STORAGE_KEY, selectedTenses);
  }, [selectedTenses]);

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

  // Columns follow the fixed grid order, or the order in which tenses were clicked.
  const displayTenses = useMemo(
    () => (tenseOrderMode === "standard" ? sortTenses(selectedTenses) : selectedTenses),
    [selectedTenses, tenseOrderMode]
  );

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

  // Same flow as the buttons: reveal the table first, then move to the next verb.
  useLearnShortcuts(
    {
      primary: () => (showConjugations ? goNext() : handleShowConjugations()),
      next: goNext,
      previous: goPrevious,
    },
    !isLoading && conjugations.length > 0,
  );

  const resetCard = () => {
    setCurrentIndex(0);
    setShowConjugations(false);
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
    <div className="space-y-5 animate-fade-in">
      {/* Search and filter toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetCard();
            }}
            placeholder="Zoek werkwoord (bv. abusar)..."
            aria-label="Zoek werkwoord"
            className="h-10 bg-card pl-9 pr-9"
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
        <Button
          type="button"
          variant="outline"
          aria-expanded={filtersOpen}
          aria-controls="conjugation-filters"
          onClick={() => setFiltersOpen((open) => !open)}
          className={cn("h-10 bg-card", filtersOpen && "border-primary bg-accent text-accent-foreground hover:bg-accent")}
        >
          <SlidersHorizontal />
          {t.common_filter}
          <span className="tabular-nums text-muted-foreground">
            · {selectedTenses.length}/{maxTenses} tijden
          </span>
          <ChevronDown className={cn("transition-transform", filtersOpen && "rotate-180")} />
        </Button>
      </div>

      {filtersOpen && (
        <section
          id="conjugation-filters"
          aria-label={t.common_filter}
          className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5 animate-fade-in"
        >
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</span>
              <div className="inline-flex gap-0.5 rounded-xl bg-muted p-1">
                {(["all", "regular", "irregular"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={verbTypeFilter === v}
                    onClick={() => {
                      setVerbTypeFilter(v);
                      resetCard();
                    }}
                    className={cn(SEGMENT_BUTTON, segmentState(verbTypeFilter === v))}
                  >
                    {v === "all" ? "Alle" : v === "regular" ? "Regelmatig" : "Onregelmatig"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kolomvolgorde</span>
              <div className="inline-flex gap-0.5 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  aria-pressed={tenseOrderMode === "standard"}
                  onClick={() => setTenseOrderMode("standard")}
                  title="Tijden in de vaste volgorde van het selectievakjestabel"
                  className={cn(SEGMENT_BUTTON, segmentState(tenseOrderMode === "standard"))}
                >
                  Standaard
                </button>
                <button
                  type="button"
                  aria-pressed={tenseOrderMode === "click"}
                  onClick={() => setTenseOrderMode("click")}
                  title="Tijden in de volgorde waarin je ze aanklikt"
                  className={cn(SEGMENT_BUTTON, segmentState(tenseOrderMode === "click"))}
                >
                  Klikvolgorde
                </button>
              </div>
            </div>
            <label className="flex h-10 cursor-pointer items-center gap-2.5 text-sm sm:ml-auto">
              <Switch
                checked={showOnlyUnseen}
                onCheckedChange={(checked) => {
                  setShowOnlyUnseen(checked);
                  resetCard();
                }}
              />
              Alleen nieuwe
            </label>
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tijden · {selectedTenses.length}/{maxTenses} gekozen
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_TENSES.map((tense) => {
                const isSelected = selectedTenses.includes(tense);
                return (
                  <label
                    key={tense}
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] transition-colors",
                      isSelected
                        ? "border-primary bg-accent font-semibold text-accent-foreground"
                        : "border-input bg-card font-medium hover:bg-muted",
                    )}
                  >
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleTense(tense)} />
                    {TENSE_LABELS[tense]}
                  </label>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Card */}
      {!currentConjugation ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Geen werkwoorden gevonden.
          </CardContent>
        </Card>
      ) : (
      <>
      <section
        aria-label={currentConjugation.infinitive}
        className="overflow-hidden rounded-3xl border bg-card shadow-card"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b px-5 pt-6 pb-5 sm:px-7">
          <div className="space-y-1.5">
            <span className="inline-flex h-6 items-center rounded-full bg-accent px-2.5 text-xs font-semibold text-accent-foreground">
              {(currentConjugation.verb_type || "regular") === "irregular" ? "Onregelmatig" : "Regelmatig"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{currentConjugation.infinitive}</h2>
            <p className="text-base text-muted-foreground">{currentConjugation.translation}</p>
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {currentIndex + 1} / {conjugations.length}
          </span>
        </div>
        <div>
          {!showConjugations ? (
            <div className="p-4 sm:p-5">
              <button
                type="button"
                onClick={handleShowConjugations}
                className="flex h-28 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-input bg-muted text-lg font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Eye className="h-5 w-5" aria-hidden="true" />
                {t.learn_show_translation}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 overflow-x-auto">
              <table className="w-full border-collapse text-sm sm:text-[15px]">
                <thead>
                  <tr className="bg-muted/60">
                    <th scope="col" className="sticky left-0 bg-muted px-4 py-3 text-left sm:px-6">
                      <span className="sr-only">Persoon</span>
                    </th>
                    {displayTenses.map((tense) => (
                      <th key={tense} scope="col" className="min-w-[150px] px-3 py-3 text-left align-top font-semibold text-accent-foreground">
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
                    <tr key={pronoun} className={cn("border-t", idx % 2 === 1 && "bg-muted/40")}>
                      <th
                        scope="row"
                        className={cn(
                          "sticky left-0 whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground sm:px-6",
                          idx % 2 === 1 ? "bg-muted" : "bg-card",
                        )}
                      >
                        {pronoun}
                      </th>
                      {displayTenses.map((tense) => {
                        const forms = getConjugationForms(currentConjugation, tense);
                        return (
                          <td key={tense} className="min-w-[150px] px-3 py-3 font-semibold">
                            {forms[idx] || "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {dutchExamples.isError && (
                <Button variant="ghost" size="sm" className="m-3" onClick={() => dutchExamples.refetch()}>
                  Nederlandse voorbeelden opnieuw laden
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-center gap-2.5">
        <Button
          variant="outline"
          className={ROUND_ICON_BUTTON}
          onClick={goPrevious}
          disabled={currentIndex === 0}
          aria-label={t.common_previous}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          className={ROUND_ICON_BUTTON}
          onClick={handleShuffle}
          aria-label={t.learn_shuffle}
          title={t.learn_shuffle}
        >
          <Shuffle />
        </Button>
        <Button
          className="h-12 flex-1 sm:flex-none rounded-[14px] px-7 text-base font-semibold [&_svg]:size-5"
          onClick={handleMarkAsSeenAndNext}
        >
          <Check />
          {t.learn_learned}
        </Button>
        <Button
          variant="outline"
          className={ROUND_ICON_BUTTON}
          onClick={goNext}
          disabled={currentIndex >= conjugations.length - 1}
          aria-label={t.common_next}
        >
          <ChevronRight />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={ROUND_ICON_BUTTON} aria-label={t.learn_more_actions}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => setDeleteDialogOpen(true)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.common_delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.learn_delete_confirm_title}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{currentConjugation.infinitive}</span>
              {" · "}
              {t.learn_delete_confirm_description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common_cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common_delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress */}
      <div className="text-center text-sm text-muted-foreground">
        {allConjugations.length > conjugations.length && (
          <span>
            {allConjugations.length - conjugations.length} {t.learn_learned}
          </span>
        )}
        <p className="mt-1 hidden md:block text-xs">{t.learn_shortcuts_hint}</p>
      </div>
      </>
      )}
    </div>
  );
}
