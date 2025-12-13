import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWordsWithProgress, markWordAsSeen, deleteWord, incrementViewCount, type WordWithProgress } from "@/lib/api";
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

export function LearnMode({ refreshTrigger }: LearnModeProps) {
  const [allWords, setAllWords] = useState<WordWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wordTypeFilter, setWordTypeFilter] = useState<string>("all");

  // Get unique word types from all words
  const wordTypes = useMemo(() => {
    const types = new Set<string>();
    allWords.forEach((word) => {
      if (word.word_type) {
        types.add(word.word_type);
      }
    });
    return Array.from(types).sort();
  }, [allWords]);

  // Filter words based on selected word type
  const words = useMemo(() => {
    if (wordTypeFilter === "all") {
      return allWords;
    }
    return allWords.filter((word) => word.word_type === wordTypeFilter);
  }, [allWords, wordTypeFilter]);

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
      const data = await getWordsWithProgress();
      setAllWords(data);
      setCurrentIndex(0);
      setShowTranslation(false);
    } catch (error) {
      toast.error("Woorden laden mislukt");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowTranslation(false);
  }, [wordTypeFilter]);

  const currentWord = words[currentIndex];

  const handleMarkAsSeen = async () => {
    if (!currentWord || currentWord.seen) return;

    try {
      await markWordAsSeen(currentWord.id);
      setAllWords((prev) =>
        prev.map((w) => (w.id === currentWord.id ? { ...w, seen: true } : w))
      );
      toast.success("Woord gemarkeerd als gezien!");
    } catch (error) {
      toast.error("Markeren mislukt");
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
      toast.success("Woord verwijderd");
    } catch (error) {
      toast.error("Verwijderen mislukt");
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
            Leer Modus
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Nog geen woorden toegevoegd. Voeg eerst woorden toe om te leren!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            Leer Modus
          </CardTitle>
          <div className="flex items-center gap-3">
            {wordTypes.length > 0 && (
              <Select value={wordTypeFilter} onValueChange={setWordTypeFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle woorden</SelectItem>
                  {wordTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                {currentWord.view_count}x gezien
              </span>
            )}
            {currentWord.seen && (
              <CheckCircle className="h-5 w-5 text-success" />
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {getLanguageName(currentWord.source_language)}
          </p>
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">
            {currentWord.source_word}
          </h2>

          {showTranslation && (
            <div className="animate-fade-in">
              <p className="text-xs text-muted-foreground mb-1">
                {getLanguageName(currentWord.target_language)}
              </p>
              <p className="text-2xl font-medium">
                {currentWord.translation}
              </p>
            </div>
          )}

          {!showTranslation && (
            <p className="text-sm text-muted-foreground mt-4">
              Klik om vertaling te zien
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
              title="Shuffle woorden"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            {!currentWord.seen && (
              <Button variant="success" onClick={handleMarkAsSeen}>
                <Eye className="h-4 w-4" />
                Gezien
              </Button>
            )}
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

        {/* Progress indicator */}
        <div className="flex gap-1 justify-center flex-wrap">
          {words.map((word, index) => (
            <button
              key={word.id}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-primary w-4"
                  : word.seen
                  ? "bg-success/50"
                  : "bg-muted-foreground/30"
              }`}
              onClick={() => {
                setCurrentIndex(index);
                setShowTranslation(false);
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
