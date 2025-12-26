import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getQuizWords, getWordsWithProgress, getAllThemes, incrementIncorrectCount, incrementCorrectCount, incrementQuizViewCount, type WordWithProgress } from "@/lib/api";
import { toast } from "sonner";
import {
  GraduationCap,
  Loader2,
  Check,
  X,
  RotateCcw,
  Trophy,
  ArrowRight,
  Filter,
  ListChecks,
  Shuffle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLanguageName } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuizResult {
  word: WordWithProgress;
  userAnswer: string;
  correct: boolean;
}

type SelectionMode = "random" | "manual";

export function QuizMode() {
  const { t } = useLanguage();
  const [quizWords, setQuizWords] = useState<WordWithProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [wordCount, setWordCount] = useState(10);
  const [immeditateFeedback, setImmediateFeedback] = useState(true);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [availableWordCount, setAvailableWordCount] = useState(0);
  const [retryMode, setRetryMode] = useState(false);
  const [retryAnswer, setRetryAnswer] = useState("");
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const [allWords, setAllWords] = useState<WordWithProgress[]>([]);
  const [allThemes, setAllThemes] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("random");
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [minNiveauFilter, setMinNiveauFilter] = useState<string>("all");
  const [themaFilter, setThemaFilter] = useState<string>("all");

  // Niveau order for filtering
  const NIVEAU_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const getNiveauIndex = (niveau: string | null): number => {
    if (!niveau) return -1;
    return NIVEAU_ORDER.indexOf(niveau.toUpperCase());
  };

  // Get seen words for manual selection
  const seenWords = useMemo(() => {
    let words = allWords.filter(w => w.seen);
    if (minNiveauFilter !== "all") {
      const minIndex = getNiveauIndex(minNiveauFilter);
      words = words.filter(w => {
        const wordIndex = getNiveauIndex(w.niveau);
        return wordIndex >= minIndex;
      });
    }
    if (themaFilter !== "all") {
      words = words.filter(w => w.thema === themaFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      words = words.filter(w => 
        w.source_word.toLowerCase().includes(query) ||
        w.translation.toLowerCase().includes(query)
      );
    }
    return words;
  }, [allWords, minNiveauFilter, themaFilter, searchQuery]);

  // Count available words based on filter
  const filteredAvailableCount = useMemo(() => {
    let words = allWords.filter(w => w.seen);
    if (minNiveauFilter !== "all") {
      const minIndex = getNiveauIndex(minNiveauFilter);
      words = words.filter(w => {
        const wordIndex = getNiveauIndex(w.niveau);
        return wordIndex >= minIndex;
      });
    }
    if (themaFilter !== "all") {
      words = words.filter(w => w.thema === themaFilter);
    }
    return words.length;
  }, [allWords, minNiveauFilter, themaFilter]);

  useEffect(() => {
    checkAvailableWords();
  }, []);

  // Update word count when filter changes
  useEffect(() => {
    if (wordCount > filteredAvailableCount && filteredAvailableCount > 0) {
      setWordCount(filteredAvailableCount);
    }
  }, [filteredAvailableCount]);

  // Clear selection when switching modes or filters
  useEffect(() => {
    setSelectedWordIds(new Set());
  }, [selectionMode, minNiveauFilter, themaFilter]);

  const checkAvailableWords = async () => {
    try {
      const [words, themes] = await Promise.all([
        getWordsWithProgress(),
        getAllThemes(),
      ]);
      setAllWords(words);
      setAllThemes(themes);
      const seenWordsCount = words.filter(w => w.seen);
      setAvailableWordCount(seenWordsCount.length);
    } catch (error) {
      console.error("Error checking available words:", error);
    }
  };

  const toggleWordSelection = (wordId: string) => {
    setSelectedWordIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    setSelectedWordIds(new Set(seenWords.map(w => w.id)));
  };

  const deselectAll = () => {
    setSelectedWordIds(new Set());
  };

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      let words: WordWithProgress[];
      
      if (selectionMode === "manual") {
        if (selectedWordIds.size === 0) {
          toast.error(t.common_error);
          return;
        }
        // Get selected words and shuffle them
        words = allWords
          .filter(w => selectedWordIds.has(w.id))
          .sort(() => Math.random() - 0.5);
      } else {
        words = await getQuizWords(wordCount, undefined, undefined, undefined, minNiveauFilter, themaFilter);
      }
      
      if (words.length === 0) {
        toast.error(t.quiz_no_words);
        return;
      }
      
      setQuizWords(words);
      setQuizStarted(true);
      setCurrentIndex(0);
      setResults([]);
      setQuizFinished(false);
      setUserAnswer("");
      setShowFeedback(false);
      setLastCorrect(null);
      setRetryMode(false);
      setRetryAnswer("");
      
      // Increment quiz view count for first word
      if (words.length > 0) {
        incrementQuizViewCount(words[0].id).catch(() => {});
      }
    } catch (error) {
      toast.error(t.common_error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentWord = quizWords[currentIndex];

  const checkAnswer = () => {
    if (!currentWord) return;

    const isCorrect =
      userAnswer.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();

    const result: QuizResult = {
      word: currentWord,
      userAnswer: userAnswer.trim(),
      correct: isCorrect,
    };

    // Only add result if this word hasn't been added yet
    setResults((prev) => {
      const alreadyExists = prev.some((r) => r.word.id === currentWord.id);
      if (alreadyExists) return prev;
      return [...prev, result];
    });
    setLastCorrect(isCorrect);

    // Increment incorrect count if wrong, correct count if right
    if (!isCorrect) {
      incrementIncorrectCount(currentWord.id).catch(() => {
        // Silent fail
      });
    } else {
      incrementCorrectCount(currentWord.id).catch(() => {
        // Silent fail
      });
    }

    if (immeditateFeedback) {
      setShowFeedback(true);
      if (!isCorrect) {
        setRetryMode(true);
        setRetryAnswer("");
      } else {
        // Focus the next button when correct so user can press Enter
        setTimeout(() => nextButtonRef.current?.focus(), 0);
      }
    } else {
      goToNext();
    }
  };

  const checkRetry = () => {
    if (!currentWord) return;
    const isCorrect =
      retryAnswer.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();
    
    if (isCorrect) {
      toast.success(t.quiz_correct);
      goToNext();
    } else {
      toast.error(t.quiz_incorrect);
      setRetryAnswer("");
    }
  };

  const goToNext = () => {
    setShowFeedback(false);
    setLastCorrect(null);
    setUserAnswer("");
    setRetryMode(false);
    setRetryAnswer("");

    if (currentIndex < quizWords.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Increment quiz view count for next word
      incrementQuizViewCount(quizWords[nextIndex].id).catch(() => {});
    } else {
      setQuizFinished(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (retryMode && retryAnswer.trim()) {
        checkRetry();
      } else if (showFeedback && !retryMode) {
        goToNext();
      } else if (userAnswer.trim()) {
        checkAnswer();
      }
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setQuizWords([]);
    setResults([]);
    setCurrentIndex(0);
    setUserAnswer("");
    setShowFeedback(false);
    setLastCorrect(null);
    setSelectedWordIds(new Set());
    checkAvailableWords();
  };

  const correctCount = results.filter((r) => r.correct).length;
  const percentage = quizWords.length > 0 ? Math.round((correctCount / quizWords.length) * 100) : 0;

  // Quiz Setup
  if (!quizStarted) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {t.quiz_title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {filteredAvailableCount === 0 && selectionMode === "random" ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground">
                {t.quiz_no_words}
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                {filteredAvailableCount} {t.common_word}
              </p>

              <div className="space-y-4">
                {/* Selection Mode Toggle */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.common_filter}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={selectionMode === "random" ? "default" : "outline"}
                      onClick={() => setSelectionMode("random")}
                      className="w-full"
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      {t.learn_shuffle}
                    </Button>
                    <Button
                      type="button"
                      variant={selectionMode === "manual" ? "default" : "outline"}
                      onClick={() => setSelectionMode("manual")}
                      className="w-full"
                    >
                      <ListChecks className="h-4 w-4 mr-2" />
                      {t.common_filter}
                    </Button>
                  </div>
                </div>


                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {t.learn_min_niveau}
                  </label>
                  <Select value={minNiveauFilter} onValueChange={setMinNiveauFilter}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={t.learn_filter_all} />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">{t.learn_filter_all}</SelectItem>
                      {NIVEAU_ORDER.map((niveau) => (
                        <SelectItem key={niveau} value={niveau}>
                          {niveau}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Thema</label>
                  <Select value={themaFilter} onValueChange={setThemaFilter}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Alle thema's" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Alle thema's</SelectItem>
                      {allThemes.map((thema) => (
                        <SelectItem key={thema} value={thema}>
                          {thema}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectionMode === "random" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.quiz_question_count}</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={wordCount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty input for typing
                        if (value === "") {
                          setWordCount(0);
                          return;
                        }
                        // Only allow numeric input
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 0) {
                          setWordCount(num);
                        }
                      }}
                      onBlur={() => {
                        // On blur, clamp the value to valid range
                        if (wordCount < 1) {
                          setWordCount(1);
                        } else if (wordCount > filteredAvailableCount && filteredAvailableCount > 0) {
                          setWordCount(filteredAvailableCount);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {selectedWordIds.size} {t.common_word}
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={selectAllVisible}
                        >
                          {t.suggest_select_all}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={deselectAll}
                        >
                          {t.suggest_select_none}
                        </Button>
                      </div>
                    </div>
                    
                    <Input
                      placeholder={t.common_search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                    
                    <ScrollArea className="h-64 border rounded-lg p-2">
                      <div className="space-y-1">
                        {seenWords.map((word) => (
                          <label
                            key={word.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedWordIds.has(word.id)}
                              onCheckedChange={() => toggleWordSelection(word.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{word.source_word}</span>
                              <span className="text-muted-foreground"> → </span>
                              <span className="text-sm">{word.translation}</span>
                            </div>
                            {word.word_type && (
                              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                {word.word_type}
                              </span>
                            )}
                          </label>
                        ))}
                        {seenWords.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            {t.learn_no_words}
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">{t.quiz_check}</p>
                  </div>
                  <Switch
                    checked={immeditateFeedback}
                    onCheckedChange={setImmediateFeedback}
                  />
                </div>
              </div>

              <Button
                variant="hero"
                onClick={startQuiz}
                disabled={isLoading || (selectionMode === "manual" && selectedWordIds.size === 0)}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )}
                {t.quiz_start} {selectionMode === "manual" && selectedWordIds.size > 0 && `(${selectedWordIds.size})`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Quiz Results
  if (quizFinished) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            {t.quiz_complete}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6">
            <div className="text-6xl font-bold mb-2 gradient-primary bg-clip-text text-transparent">
              {percentage}%
            </div>
            <p className="text-muted-foreground">
              {correctCount} / {quizWords.length} {t.quiz_correct}
            </p>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.correct
                    ? "bg-success/10 border-success/30"
                    : "bg-destructive/10 border-destructive/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.correct ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-medium">{result.word.source_word}</span>
                </div>
                {!result.correct && (
                  <div className="ml-6 mt-1 text-sm">
                    <span className="text-muted-foreground">{t.quiz_your_answer}: </span>
                    <span className="text-destructive">{result.userAnswer || "-"}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="text-success">{result.word.translation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={resetQuiz} className="w-full">
            <RotateCcw className="h-4 w-4" />
            {t.quiz_restart}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Quiz Question
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {t.quiz_title}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {quizWords.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-2">{t.common_translate} → {getLanguageName(currentWord?.target_language || "")}:</p>
          <h2 className="text-3xl font-bold">{currentWord?.source_word}</h2>
        </div>

        {showFeedback ? (
          <div className="space-y-4 animate-scale-in">
            <div
              className={`p-4 rounded-lg text-center ${
                lastCorrect
                  ? "bg-success/10 border border-success/30"
                  : "bg-destructive/10 border border-destructive/30"
              }`}
            >
              {lastCorrect ? (
                <div className="flex items-center justify-center gap-2 text-success">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">{t.quiz_correct}</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-2 text-destructive mb-2">
                    <X className="h-5 w-5" />
                    <span className="font-medium">{t.quiz_incorrect}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{currentWord?.translation}</span>
                  </p>
                </div>
              )}
            </div>
            {retryMode ? (
              <div className="space-y-2">
                <Input
                  value={retryAnswer}
                  onChange={(e) => setRetryAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentWord?.translation}
                  autoFocus
                  className="text-center text-lg"
                />
                <Button
                  variant="default"
                  onClick={checkRetry}
                  disabled={!retryAnswer.trim()}
                  className="w-full"
                >
                  <Check className="h-4 w-4" />
                  {t.quiz_check}
                </Button>
              </div>
            ) : (
              <Button ref={nextButtonRef} variant="default" onClick={goToNext} className="w-full">
                <ArrowRight className="h-4 w-4" />
                {t.common_next}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.quiz_your_answer}
              autoFocus
              className="text-center text-lg"
            />
            <Button
              variant="hero"
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className="w-full"
            >
              <Check className="h-4 w-4" />
              {t.quiz_check}
            </Button>
          </div>
        )}

        {/* Progress bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / quizWords.length) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
