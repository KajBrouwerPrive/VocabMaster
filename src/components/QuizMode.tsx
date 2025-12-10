import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getQuizWords, type Word } from "@/lib/api";
import { toast } from "sonner";
import {
  GraduationCap,
  Loader2,
  Check,
  X,
  RotateCcw,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface QuizResult {
  word: Word;
  userAnswer: string;
  correct: boolean;
}

export function QuizMode() {
  const [quizWords, setQuizWords] = useState<Word[]>([]);
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

  useEffect(() => {
    checkAvailableWords();
  }, []);

  const checkAvailableWords = async () => {
    try {
      const words = await getQuizWords(1000);
      setAvailableWordCount(words.length);
    } catch (error) {
      console.error("Error checking available words:", error);
    }
  };

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const words = await getQuizWords(wordCount);
      if (words.length === 0) {
        toast.error("Geen geziene woorden beschikbaar. Leer eerst woorden in Leer Modus!");
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
    } catch (error) {
      toast.error("Quiz starten mislukt");
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

    setResults((prev) => [...prev, result]);
    setLastCorrect(isCorrect);

    if (immeditateFeedback) {
      setShowFeedback(true);
    } else {
      goToNext();
    }
  };

  const goToNext = () => {
    setShowFeedback(false);
    setLastCorrect(null);
    setUserAnswer("");

    if (currentIndex < quizWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showFeedback) {
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
            Toets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {availableWordCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Geen geziene woorden beschikbaar. Leer eerst woorden in Leer Modus!
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                {availableWordCount} woorden beschikbaar voor toets
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aantal vragen</label>
                  <Input
                    type="number"
                    min={1}
                    max={availableWordCount}
                    value={wordCount}
                    onChange={(e) =>
                      setWordCount(
                        Math.min(parseInt(e.target.value) || 1, availableWordCount)
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">Directe feedback</p>
                    <p className="text-sm text-muted-foreground">
                      {immeditateFeedback
                        ? "Je ziet direct of het goed of fout is"
                        : "Je ziet alle resultaten aan het einde"}
                    </p>
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
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )}
                Start Toets
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
            Resultaat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6">
            <div className="text-6xl font-bold mb-2 gradient-primary bg-clip-text text-transparent">
              {percentage}%
            </div>
            <p className="text-muted-foreground">
              {correctCount} van {quizWords.length} goed
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
                    <span className="text-muted-foreground">Jouw antwoord: </span>
                    <span className="text-destructive">{result.userAnswer || "(leeg)"}</span>
                    <span className="text-muted-foreground"> → Correct: </span>
                    <span className="text-success">{result.word.translation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={resetQuiz} className="w-full">
            <RotateCcw className="h-4 w-4" />
            Opnieuw
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
            Toets
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {quizWords.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-2">Vertaal naar het Engels:</p>
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
                  <span className="font-medium">Correct!</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-2 text-destructive mb-2">
                    <X className="h-5 w-5" />
                    <span className="font-medium">Fout</span>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Correct antwoord: </span>
                    <span className="font-medium">{currentWord?.translation}</span>
                  </p>
                </div>
              )}
            </div>
            <Button variant="default" onClick={goToNext} className="w-full">
              <ArrowRight className="h-4 w-4" />
              Volgende
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type je antwoord..."
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
              Controleer
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
