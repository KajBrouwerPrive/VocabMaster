import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getConjugations,
  incrementConjugationIncorrectCount,
  incrementConjugationCorrectCount,
  incrementConjugationQuizViewCount,
  VerbConjugationWithProgress,
} from "@/lib/conjugationApi";
import { saveQuizResult } from "@/lib/api";
import { toast } from "sonner";
import {
  GraduationCap,
  Loader2,
  Check,
  X,
  RotateCcw,
  Trophy,
  ArrowRight,
  Timer,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

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
const PRONOUN_KEYS = ["ik", "jij", "hij_zij", "wij", "jullie", "zij"];

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

interface QuizQuestion {
  conjugation: VerbConjugationWithProgress;
  tense: TenseType;
  pronounIndex: number;
  correctAnswer: string;
}

interface QuizResult {
  question: QuizQuestion;
  userAnswer: string;
  correct: boolean;
}

export function ConjugationQuizMode() {
  const { t } = useLanguage();
  const [allConjugations, setAllConjugations] = useState<VerbConjugationWithProgress[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [immediateFeedback, setImmediateFeedback] = useState(true);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [retryMode, setRetryMode] = useState(false);
  const [retryAnswer, setRetryAnswer] = useState("");
  const [selectedTenses, setSelectedTenses] = useState<TenseType[]>(["present"]);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  const seenConjugations = useMemo(() => {
    return allConjugations.filter(c => c.progress?.seen);
  }, [allConjugations]);

  useEffect(() => {
    loadConjugations();
  }, []);

  const loadConjugations = async () => {
    try {
      const data = await getConjugations("nl", "es");
      setAllConjugations(data);
    } catch (error) {
      console.error("Error loading conjugations:", error);
    }
  };

  const toggleTense = (tense: TenseType) => {
    setSelectedTenses((prev) => {
      if (prev.includes(tense)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== tense);
      }
      return [...prev, tense];
    });
  };

  const getConjugationForm = (conj: VerbConjugationWithProgress, tense: TenseType, pronounKey: string): string => {
    const key = `${tense}_${pronounKey}` as keyof VerbConjugationWithProgress;
    return (conj[key] as string) || "";
  };

  const generateQuestions = (): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    const seen = seenConjugations;
    
    if (seen.length === 0 || selectedTenses.length === 0) return [];

    // Generate all possible questions - only for tenses the user has learned for each verb
    const allPossible: QuizQuestion[] = [];
    for (const conj of seen) {
      // Get learned tenses for this conjugation
      const learnedTenses = conj.tenseProgress
        ?.filter(tp => tp.seen)
        .map(tp => tp.tense) || [];
      
      // Only include tenses that are both selected AND learned
      const availableTenses = selectedTenses.filter(t => learnedTenses.includes(t));
      
      for (const tense of availableTenses) {
        for (let i = 0; i < PRONOUN_KEYS.length; i++) {
          const answer = getConjugationForm(conj, tense, PRONOUN_KEYS[i]);
          if (answer) {
            allPossible.push({
              conjugation: conj,
              tense,
              pronounIndex: i,
              correctAnswer: answer,
            });
          }
        }
      }
    }

    // Shuffle and take requested count
    const shuffled = allPossible.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(questionCount, shuffled.length));
  };

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const quizQuestions = generateQuestions();
      
      if (quizQuestions.length === 0) {
        toast.error(t.quiz_no_words);
        return;
      }
      
      setQuestions(quizQuestions);
      setQuizStarted(true);
      setQuizStartTime(Date.now());
      setCurrentIndex(0);
      setResults([]);
      setQuizFinished(false);
      setUserAnswer("");
      setShowFeedback(false);
      setLastCorrect(null);
      setRetryMode(false);
      setRetryAnswer("");
      
      // Increment quiz view count for first question
      if (quizQuestions.length > 0) {
        incrementConjugationQuizViewCount(quizQuestions[0].conjugation.id).catch(() => {});
      }
    } catch (error) {
      toast.error(t.common_error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const normalizeAnswer = (answer: string): string => {
    let normalized = answer.toLowerCase().trim();
    // Remove pronoun prefix if user typed it or if it's in the correct answer
    // Handle combined pronouns first (e.g., "él/ella viaja" -> "viaja")
    const combinedPronounPrefixes = [
      "él/ella/usted ", "el/ella/usted ",
      "ellos/ellas/ustedes ", 
      "él/ella ", "el/ella ", 
      "ellos/ellas "
    ];
    for (const prefix of combinedPronounPrefixes) {
      if (normalized.startsWith(prefix)) {
        normalized = normalized.slice(prefix.length).trim();
        return normalized;
      }
    }
    // Handle single pronouns
    const pronounPrefixes = ["yo ", "tú ", "tu ", "él ", "el ", "ella ", "usted ", "nosotros ", "nosotras ", "vosotros ", "vosotras ", "ellos ", "ellas ", "ustedes "];
    for (const prefix of pronounPrefixes) {
      if (normalized.startsWith(prefix)) {
        normalized = normalized.slice(prefix.length).trim();
        break;
      }
    }
    return normalized;
  };

  const checkAnswer = () => {
    if (!currentQuestion) return;

    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    const normalizedCorrectAnswer = normalizeAnswer(currentQuestion.correctAnswer);
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    const result: QuizResult = {
      question: currentQuestion,
      userAnswer: userAnswer.trim(),
      correct: isCorrect,
    };

    setResults((prev) => {
      const alreadyExists = prev.some(
        (r) => 
          r.question.conjugation.id === currentQuestion.conjugation.id &&
          r.question.tense === currentQuestion.tense &&
          r.question.pronounIndex === currentQuestion.pronounIndex
      );
      if (alreadyExists) return prev;
      return [...prev, result];
    });
    setLastCorrect(isCorrect);

    if (!isCorrect) {
      incrementConjugationIncorrectCount(currentQuestion.conjugation.id).catch(() => {});
    } else {
      incrementConjugationCorrectCount(currentQuestion.conjugation.id).catch(() => {});
    }

    if (immediateFeedback) {
      setShowFeedback(true);
      if (!isCorrect) {
        setRetryMode(true);
        setRetryAnswer("");
      } else {
        setTimeout(() => nextButtonRef.current?.focus(), 0);
      }
    } else {
      goToNext();
    }
  };

  const checkRetry = () => {
    if (!currentQuestion) return;
    const isCorrect = normalizeAnswer(retryAnswer) === normalizeAnswer(currentQuestion.correctAnswer);
    
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

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      incrementConjugationQuizViewCount(questions[nextIndex].conjugation.id).catch(() => {});
    } else {
      // Save quiz result before finishing
      const finalResults = [...results];
      if (!finalResults.some(r => 
        r.question.conjugation.id === currentQuestion?.conjugation.id &&
        r.question.tense === currentQuestion?.tense &&
        r.question.pronounIndex === currentQuestion?.pronounIndex
      )) {
        const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(currentQuestion?.correctAnswer || "");
        finalResults.push({ question: currentQuestion!, userAnswer: userAnswer.trim(), correct: isCorrect });
      }
      const correctAnswers = finalResults.filter(r => r.correct).length;
      const scorePercentage = Math.round((correctAnswers / questions.length) * 100);
      
      // Calculate duration
      const durationSeconds = quizStartTime ? Math.round((Date.now() - quizStartTime) / 1000) : null;
      
      saveQuizResult({
        quiz_type: 'conjugations',
        score_percentage: scorePercentage,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        tenses: selectedTenses,
        duration_seconds: durationSeconds,
      }).catch(() => {});
      
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
    setQuestions([]);
    setResults([]);
    setCurrentIndex(0);
    setUserAnswer("");
    setShowFeedback(false);
    setLastCorrect(null);
    setQuizStartTime(null);
    loadConjugations();
  };

  const correctCount = results.filter((r) => r.correct).length;
  const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  // Quiz Setup
  if (!quizStarted) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {t.nav_quiz_conjugations}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {seenConjugations.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground">
                {t.quiz_no_words}
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                {seenConjugations.length} {t.common_word.toLowerCase()}en beschikbaar
              </p>

              <div className="space-y-4">
                {/* Tense Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.common_filter}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.quiz_question_count}</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">{t.quiz_check}</p>
                  </div>
                  <Switch
                    checked={immediateFeedback}
                    onCheckedChange={setImmediateFeedback}
                  />
                </div>
              </div>

              <Button
                variant="hero"
                onClick={startQuiz}
                disabled={isLoading || selectedTenses.length === 0}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GraduationCap className="h-4 w-4" />
                )}
                {t.quiz_start}
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
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t.quiz_complete}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-5xl font-bold text-primary">{percentage}%</p>
            <p className="text-muted-foreground">
              {correctCount} / {questions.length} {t.quiz_correct.toLowerCase().replace('!', '')}
            </p>
            {quizStartTime && (
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50">
                  <Timer className="h-4 w-4" />
                  <span className="font-medium">
                    {Math.floor((Date.now() - quizStartTime) / 60000)}{t.stats_minutes_short} {Math.floor(((Date.now() - quizStartTime) / 1000) % 60)}{t.stats_seconds_short}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50">
                  <span className="font-medium">
                    {((Date.now() - quizStartTime) / 1000 / questions.length).toFixed(1)}{t.stats_seconds_short}
                  </span>
                  <span>{t.stats_time_per_word}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.correct
                    ? "bg-success/10 border border-success/20"
                    : "bg-destructive/10 border border-destructive/20"
                }`}
              >
                {result.correct ? (
                  <Check className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-destructive shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {result.question.conjugation.infinitive} - {TENSE_LABELS[result.question.tense]} ({PRONOUNS[result.question.pronounIndex]})
                  </p>
                  {!result.correct && (
                    <p className="text-sm text-muted-foreground">
                      {result.userAnswer} → {result.question.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={resetQuiz} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
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
            {t.nav_quiz_conjugations}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-3xl font-bold">{currentQuestion.conjugation.infinitive}</p>
          <p className="text-muted-foreground">({currentQuestion.conjugation.translation})</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {TENSE_LABELS[currentQuestion.tense]}
            </span>
            <span className="px-3 py-1 bg-secondary text-foreground rounded-full text-sm font-medium">
              {PRONOUNS[currentQuestion.pronounIndex]}
            </span>
          </div>
        </div>

        {!showFeedback ? (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder={t.quiz_your_answer}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-center text-lg"
            />
            <Button
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className="w-full"
            >
              {t.quiz_check}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg text-center ${
                lastCorrect
                  ? "bg-success/10 border border-success/20"
                  : "bg-destructive/10 border border-destructive/20"
              }`}
            >
              {lastCorrect ? (
                <div className="flex items-center justify-center gap-2 text-success">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">{t.quiz_correct}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <X className="h-5 w-5" />
                    <span className="font-medium">{t.quiz_incorrect}</span>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t.quiz_your_answer}: </span>
                    <span className="line-through">{userAnswer}</span>
                  </p>
                  <p className="font-semibold">{currentQuestion.correctAnswer}</p>
                </div>
              )}
            </div>

            {retryMode ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder={currentQuestion.correctAnswer}
                  value={retryAnswer}
                  onChange={(e) => setRetryAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="text-center text-lg"
                />
                <Button onClick={checkRetry} disabled={!retryAnswer.trim()} className="w-full">
                  {t.quiz_check}
                </Button>
              </div>
            ) : (
              <Button ref={nextButtonRef} onClick={goToNext} className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                {t.common_next}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
