import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getWordsWithProgress, markWordAsSeen, incrementViewCount, getAllThemes, type WordWithProgress } from "@/lib/api";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  CheckCircle,
  Shuffle,
} from "lucide-react";
import { getLanguageName } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";
import { useLearnShortcuts } from "@/hooks/useLearnShortcuts";

interface LearnModeProps {
  refreshTrigger: number;
}

// Niveau group values for filtering (labels will be translated)
const NIVEAU_GROUP_VALUES = [
  { value: "A1", levels: ["A1"] },
  { value: "A2", levels: ["A2"] },
  { value: "B1", levels: ["B1"] },
  { value: "B2", levels: ["B2"] },
  { value: "C1", levels: ["C1"] },
  { value: "C2", levels: ["C2"] },
  { value: "difficult", levels: [] },
];

const matchesNiveauGroups = (word: WordWithProgress, selectedGroups: Set<string>): boolean => {
  if (selectedGroups.size === 0) return true;

  for (const group of selectedGroups) {
    if (group === "difficult") {
      if ((word.incorrect_count - (word.correct_count || 0)) > 2) return true;
    } else {
      const niveauGroup = NIVEAU_GROUP_VALUES.find(g => g.value === group);
      if (niveauGroup && word.niveau && niveauGroup.levels.includes(word.niveau.toUpperCase())) {
        return true;
      }
    }
  }
  return false;
};

const matchesThemas = (word: WordWithProgress, selectedThemas: Set<string>): boolean => {
  if (selectedThemas.size === 0) return true;
  return word.thema ? selectedThemas.has(word.thema) : false;
};

const shuffleWords = (wordsToShuffle: WordWithProgress[]) => {
  const shuffled = [...wordsToShuffle];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ROUND_ICON_BUTTON = "h-12 w-12 rounded-[14px] p-0 [&_svg]:size-5";

export function LearnMode({ refreshTrigger }: LearnModeProps) {
  const { t } = useLanguage();
  const [allWords, setAllWords] = useState<WordWithProgress[]>([]);
  const [allThemes, setAllThemes] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNiveaus, setSelectedNiveaus] = useState<Set<string>>(new Set());
  const [selectedThemas, setSelectedThemas] = useState<Set<string>>(new Set());

  // Filter words based on selected niveaus and themes
  const words = useMemo(() => {
    return allWords.filter((word) =>
      matchesNiveauGroups(word, selectedNiveaus) &&
      matchesThemas(word, selectedThemas)
    );
  }, [allWords, selectedNiveaus, selectedThemas]);

  useEffect(() => {
    const loadWords = async () => {
      setIsLoading(true);
      try {
        const [data, themes] = await Promise.all([
          getWordsWithProgress(),
          getAllThemes(),
        ]);
        setAllWords(data);
        setAllThemes(themes);
        setCurrentIndex(0);
        setShowTranslation(false);
      } catch (error) {
        console.error("Failed to load words:", error);
        toast.error(t.common_error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWords();
    // Reload only when the parent signals new words, not when the app language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowTranslation(false);
  }, [selectedNiveaus, selectedThemas]);

  const currentWord = words[currentIndex];

  const revealTranslation = () => {
    if (!currentWord) return;
    setShowTranslation(true);
    incrementViewCount(currentWord.id)
      .then(() => {
        setAllWords((prev) =>
          prev.map((w) => (w.id === currentWord.id ? { ...w, view_count: (w.view_count || 0) + 1 } : w))
        );
      })
      .catch((error) => {
        // The view count is informational; learning continues without it.
        console.error("Failed to increment view count:", error);
      });
  };

  // Marks the current word as learned in the background and moves on; restarts a shuffled cycle after the last word.
  const markLearnedAndAdvance = () => {
    if (!currentWord) return;
    setShowTranslation(false);
    if (!currentWord.seen) {
      markWordAsSeen(currentWord.id)
        .then(() => {
          setAllWords((prev) =>
            prev.map((w) => (w.id === currentWord.id ? { ...w, seen: true } : w))
          );
        })
        .catch((error) => {
          // Progress is saved again the next time the word is marked learned.
          console.error("Failed to mark word as seen:", error);
        });
    }
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setAllWords(shuffleWords(allWords));
      setCurrentIndex(0);
    }
  };

  // First press reveals the translation, the second marks the word learned and moves on.
  const handleCardAction = () => {
    if (showTranslation) {
      markLearnedAndAdvance();
    } else {
      revealTranslation();
    }
  };

  const goNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTranslation(false);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowTranslation(false);
    }
  };

  const handleShuffle = () => {
    setAllWords(shuffleWords(allWords));
    setCurrentIndex(0);
    setShowTranslation(false);
  };

  useLearnShortcuts(
    { primary: handleCardAction, next: goNext, previous: goPrevious },
    !isLoading && words.length > 0,
  );

  const niveauOptions = NIVEAU_GROUP_VALUES.map(g => ({
    value: g.value,
    label: g.value === "difficult" ? t.filter_difficult_words : g.value
  }));
  const themaOptions = allThemes.map(theme => ({ value: theme, label: theme }));

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const filters = (
    <div className="flex items-center gap-2 flex-wrap">
      <MultiSelectFilter
        options={niveauOptions}
        selectedValues={selectedNiveaus}
        onSelectionChange={setSelectedNiveaus}
        placeholder={t.filter_niveau}
      />
      <MultiSelectFilter
        options={themaOptions}
        selectedValues={selectedThemas}
        onSelectionChange={setSelectedThemas}
        placeholder={t.filter_thema}
      />
    </div>
  );

  if (!currentWord) {
    return (
      <div className="space-y-5 animate-fade-in">
        {filters}
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t.learn_no_words}
          </CardContent>
        </Card>
      </div>
    );
  }

  const seenCount = words.filter((w) => w.seen).length;
  const percentage = Math.round((seenCount / words.length) * 100);
  const metaLabel = [currentWord.niveau?.toUpperCase(), currentWord.thema].filter(Boolean).join(" · ");
  const shownLanguage = showTranslation ? currentWord.target_language : currentWord.source_language;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {filters}
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{seenCount} / {words.length} {t.learn_learned}</span>
          <span className="font-semibold text-accent-foreground">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      {/* Word card */}
      <button
        type="button"
        onClick={handleCardAction}
        aria-live="polite"
        className="relative flex min-h-[320px] w-full flex-col items-center justify-center gap-2 rounded-3xl border bg-card px-6 pt-14 pb-10 text-center shadow-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="absolute top-4 left-4 flex flex-wrap gap-1.5">
          <span className="inline-flex h-6 items-center rounded-full bg-accent px-2.5 text-xs font-semibold text-accent-foreground">
            {getLanguageName(shownLanguage)}
          </span>
          {metaLabel && (
            <span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground">
              {metaLabel}
            </span>
          )}
        </span>
        <span className="absolute top-4 right-4 flex items-center gap-2">
          {currentWord.view_count > 0 && (
            <span className="text-xs text-muted-foreground">{currentWord.view_count}×</span>
          )}
          {currentWord.seen && <CheckCircle className="h-5 w-5 text-success" aria-label={t.learn_learned} />}
        </span>

        {showTranslation ? (
          <span className="flex flex-col items-center gap-2 animate-fade-in">
            <span className="text-lg font-medium" style={{ color: "hsl(var(--word-source-small))" }}>
              {currentWord.source_word}
            </span>
            <span
              className="text-4xl sm:text-5xl font-bold tracking-tight break-words"
              style={{ color: "hsl(var(--word-translation))" }}
            >
              {currentWord.translation}
            </span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2">
            <span
              className="text-4xl sm:text-5xl font-bold tracking-tight break-words"
              style={{ color: "hsl(var(--word-source))" }}
            >
              {currentWord.source_word}
            </span>
            {currentWord.context && (
              <span className="text-base text-muted-foreground">({currentWord.context})</span>
            )}
            <span className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {t.learn_show_translation}
            </span>
          </span>
        )}
      </button>

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
          onClick={markLearnedAndAdvance}
        >
          <Check />
          {t.common_next}
        </Button>
        <Button
          variant="outline"
          className={ROUND_ICON_BUTTON}
          onClick={goNext}
          disabled={currentIndex === words.length - 1}
          aria-label={t.common_next}
        >
          <ChevronRight />
        </Button>
      </div>

      <p className="hidden md:block text-center text-xs text-muted-foreground">{t.learn_shortcuts_hint}</p>
    </div>
  );
}
