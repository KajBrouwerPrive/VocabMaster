import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getWordsWithProgress, markWordAsSeen, deleteWord, incrementViewCount, getAllThemes, type WordWithProgress } from "@/lib/api";
import { toast } from "sonner";
import {
  Book,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  Shuffle,
  Filter,
} from "lucide-react";
import { getLanguageName } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LearnModeProps {
  refreshTrigger: number;
}

// Level order for filtering
const NIVEAU_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const getNiveauIndex = (niveau: string | null | undefined): number => {
  if (!niveau) return -1;
  return NIVEAU_ORDER.indexOf(niveau.toUpperCase());
};

export function LearnMode({ refreshTrigger }: LearnModeProps) {
  const { t } = useLanguage();
  const [allWords, setAllWords] = useState<WordWithProgress[]>([]);
  const [allThemes, setAllThemes] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [minNiveauFilter, setMinNiveauFilter] = useState<string>("all");
  const [themaFilter, setThemaFilter] = useState<string>("all");

  // Filter words based on minimum niveau and theme
  const words = useMemo(() => {
    let filtered = allWords;
    
    // Filter by minimum niveau
    if (minNiveauFilter !== "all") {
      const minIndex = getNiveauIndex(minNiveauFilter);
      filtered = filtered.filter((word) => {
        const wordIndex = getNiveauIndex(word.niveau);
        return wordIndex >= minIndex;
      });
    }

    // Filter by theme
    if (themaFilter !== "all") {
      filtered = filtered.filter((word) => word.thema === themaFilter);
    }
    
    return filtered;
  }, [allWords, minNiveauFilter, themaFilter]);

  const shuffleWords = (wordsToShuffle: WordWithProgress[]) => {
    const shuffled = [...wordsToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    loadWords();
  }, [refreshTrigger]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && words.length > 0) {
        e.preventDefault();
        
        if (!showTranslation) {
          setShowTranslation(true);
          // Increment view count when showing translation
          const currentWord = words[currentIndex];
          if (currentWord) {
            incrementViewCount(currentWord.id)
              .then(() => {
                setAllWords((prev) =>
                  prev.map((w) => (w.id === currentWord.id ? { ...w, view_count: (w.view_count || 0) + 1 } : w))
                );
              })
              .catch(() => {
                // Silent fail
              });
          }
        } else {
          // Hide translation immediately
          setShowTranslation(false);
          
          // Mark current word as seen (async, in background)
          const currentWord = words[currentIndex];
          if (currentWord && !currentWord.seen) {
            markWordAsSeen(currentWord.id)
              .then(() => {
                setAllWords((prev) =>
                  prev.map((w) => (w.id === currentWord.id ? { ...w, seen: true } : w))
                );
              })
              .catch(() => {
                // Silent fail
              });
          }

          if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            // Start new randomized cycle
            setAllWords(shuffleWords(allWords));
            setCurrentIndex(0);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTranslation, currentIndex, words]);

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
      toast.error(t.common_error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowTranslation(false);
  }, [minNiveauFilter, themaFilter]);

  const currentWord = words[currentIndex];

  const handleMarkAsSeen = async () => {
    if (!currentWord || currentWord.seen) return;

    try {
      await markWordAsSeen(currentWord.id);
      setAllWords((prev) =>
        prev.map((w) => (w.id === currentWord.id ? { ...w, seen: true } : w))
      );
    } catch (error) {
      toast.error(t.common_error);
    }
  };

  const handleDelete = async () => {
    if (!currentWord) return;

    try {
      await deleteWord(currentWord.id);
      setAllWords((prev) => prev.filter((w) => w.id !== currentWord.id));
      if (currentIndex >= words.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
      setShowTranslation(false);
    } catch (error) {
      toast.error(t.common_error);
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

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (words.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            {t.learn_title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            {t.learn_no_words}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            {t.learn_title}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={minNiveauFilter} onValueChange={setMinNiveauFilter}>
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {NIVEAU_ORDER.map((niveau) => (
                  <SelectItem key={niveau} value={niveau}>
                    {niveau}+
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={themaFilter} onValueChange={setThemaFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Thema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle thema's</SelectItem>
                {allThemes.map((thema) => (
                  <SelectItem key={thema} value={thema}>
                    {thema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {words.length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Word Card */}
        <div
          className="relative min-h-[200px] rounded-xl bg-secondary/50 p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-secondary/70 border-2 border-black"
          onClick={() => {
            if (!showTranslation) {
              setShowTranslation(true);
              // Increment view count when showing translation
              if (currentWord) {
                incrementViewCount(currentWord.id)
                  .then(() => {
                    setAllWords((prev) =>
                      prev.map((w) => (w.id === currentWord.id ? { ...w, view_count: (w.view_count || 0) + 1 } : w))
                    );
                  })
                  .catch(() => {});
              }
            } else {
              setShowTranslation(false);
              // Mark as seen when hiding translation
              if (currentWord && !currentWord.seen) {
                markWordAsSeen(currentWord.id)
                  .then(() => {
                    setAllWords((prev) =>
                      prev.map((w) => (w.id === currentWord.id ? { ...w, seen: true } : w))
                    );
                  })
                  .catch(() => {});
              }
              // Go to next word or restart cycle
              if (currentIndex < words.length - 1) {
                setCurrentIndex(currentIndex + 1);
              } else {
                setAllWords(shuffleWords(allWords));
                setCurrentIndex(0);
              }
            }
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {currentWord.view_count > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {currentWord.view_count}x
              </span>
            )}
            {currentWord.seen && (
              <CheckCircle className="h-5 w-5 text-success" />
            )}
          </div>

          {showTranslation && (
            <div className="animate-fade-in mb-4 grid grid-cols-[80px_1fr_80px] items-center gap-2 w-full">
              <p className="text-xs text-muted-foreground text-right">
                {getLanguageName(currentWord.target_language)}
              </p>
              <p className="text-3xl font-bold text-foreground text-center">
                {currentWord.translation}
              </p>
              <div></div>
            </div>
          )}

          <div className="grid grid-cols-[80px_1fr_80px] items-center gap-2 w-full">
            <p className="text-xs text-muted-foreground text-right">
              {getLanguageName(currentWord.source_language)}
            </p>
            <h2 className={`font-bold transition-all text-primary text-center ${showTranslation ? 'text-xl' : 'text-3xl'}`}>
              {currentWord.source_word}
            </h2>
            <div></div>
          </div>

          {!showTranslation && (
            <p className="text-sm text-muted-foreground mt-4">
              {t.learn_show_translation}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setAllWords(shuffleWords(allWords));
                setCurrentIndex(0);
                setShowTranslation(false);
              }}
              title={t.learn_shuffle}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button
              variant="success"
              onClick={async () => {
                // Mark current word as learned
                if (currentWord && !currentWord.seen) {
                  try {
                    await markWordAsSeen(currentWord.id);
                    setAllWords((prev) =>
                      prev.map((w) => (w.id === currentWord.id ? { ...w, seen: true } : w))
                    );
                  } catch (error) {
                    // Silent fail
                  }
                }
                // Go to next word or restart cycle
                setShowTranslation(false);
                if (currentIndex < words.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                } else {
                  setAllWords(shuffleWords(allWords));
                  setCurrentIndex(0);
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
              {t.common_next}
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            disabled={currentIndex === words.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        {(() => {
          const seenCount = words.filter(w => w.seen).length;
          const percentage = Math.round((seenCount / words.length) * 100);
          return (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{seenCount} / {words.length} {t.learn_learned}</span>
                <span className="font-medium text-primary">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
