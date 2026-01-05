import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWordsWithProgress, type WordWithProgress } from "@/lib/api";
import { getConjugations, type VerbConjugationWithProgress } from "@/lib/conjugationApi";
import { toast } from "sonner";
import { BarChart3, AlertTriangle, Loader2, GraduationCap, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { QuizStatistics } from "@/components/QuizStatistics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Statistics() {
  const { t } = useLanguage();
  const [words, setWords] = useState<WordWithProgress[]>([]);
  const [conjugations, setConjugations] = useState<VerbConjugationWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const NIVEAU_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wordsData, conjugationsData] = await Promise.all([
        getWordsWithProgress(),
        getConjugations()
      ]);
      setWords(wordsData);
      setConjugations(conjugationsData);
    } catch (error) {
      toast.error(t.common_error);
    } finally {
      setIsLoading(false);
    }
  };

  // Word statistics
  const seenWords = words.filter((word) => word.seen);
  const difficultWords = words.filter((word) => (word.incorrect_count - (word.correct_count || 0)) > 2);

  // Conjugation statistics
  const seenConjugations = conjugations.filter((conj) => conj.progress?.seen);
  const difficultConjugations = conjugations.filter((conj) => {
    const incorrect = conj.progress?.incorrect_count || 0;
    const correct = conj.progress?.correct_count || 0;
    return (incorrect - correct) > 2;
  });

  // Statistics per niveau for words
  const niveauStats = useMemo(() => {
    const stats: Record<string, { total: number; seen: number; correct: number; incorrect: number }> = {};
    
    NIVEAU_ORDER.forEach(niveau => {
      stats[niveau] = { total: 0, seen: 0, correct: 0, incorrect: 0 };
    });
    stats["Geen niveau"] = { total: 0, seen: 0, correct: 0, incorrect: 0 };

    words.forEach(word => {
      const niveau = word.niveau && NIVEAU_ORDER.includes(word.niveau.toUpperCase()) 
        ? word.niveau.toUpperCase() 
        : "Geen niveau";
      
      stats[niveau].total++;
      if (word.seen) stats[niveau].seen++;
      stats[niveau].correct += word.correct_count || 0;
      stats[niveau].incorrect += word.incorrect_count || 0;
    });

    return Object.entries(stats)
      .filter(([_, data]) => data.total > 0)
      .sort((a, b) => {
        const indexA = NIVEAU_ORDER.indexOf(a[0]);
        const indexB = NIVEAU_ORDER.indexOf(b[0]);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
  }, [words]);

  // Tense labels for display
  const TENSE_LABELS: Record<string, string> = {
    present: "Presente",
    past: "Imperfecto",
    perfect: "Perfecto",
    indefinido: "Indefinido",
    futuro: "Futuro",
    futuro_perfecto: "Futuro Perfecto",
    condicional: "Condicional",
    pluscuamperfecto: "Pluscuamperfecto",
    subjuntivo_presente: "Subjuntivo Presente",
    subjuntivo_imperfecto: "Subjuntivo Imperfecto",
  };

  const TENSES = Object.keys(TENSE_LABELS);

  // Conjugation stats per tense
  const conjugationTenseStats = useMemo(() => {
    const stats: Record<string, { total: number; seen: number }> = {};
    
    TENSES.forEach(tense => {
      stats[tense] = { total: 0, seen: 0 };
    });

    conjugations.forEach(conj => {
      // Check which tenses have data for this conjugation
      TENSES.forEach(tense => {
        // Check if this conjugation has data for this tense (using _ik form as indicator)
        const tenseKey = `${tense}_ik` as keyof typeof conj;
        const tenseValue = conj[tenseKey];
        
        if (tenseValue && typeof tenseValue === 'string' && tenseValue.trim() !== '') {
          stats[tense].total++;
          if (conj.progress?.seen) {
            stats[tense].seen++;
          }
        }
      });
    });

    return Object.entries(stats)
      .filter(([_, data]) => data.total > 0);
  }, [conjugations]);

  // Conjugation overall stats
  const conjugationStats = useMemo(() => {
    let totalCorrect = 0;
    let totalIncorrect = 0;

    conjugations.forEach(conj => {
      totalCorrect += conj.progress?.correct_count || 0;
      totalIncorrect += conj.progress?.incorrect_count || 0;
    });

    return { totalCorrect, totalIncorrect };
  }, [conjugations]);

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quiz Statistics */}
      <QuizStatistics />
      
      <Tabs defaultValue="words" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="words" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t.nav_learn_words}
          </TabsTrigger>
          <TabsTrigger value="conjugations" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t.nav_learn_conjugations}
          </TabsTrigger>
        </TabsList>

        {/* Words Tab */}
        <TabsContent value="words" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t.stats_title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <p className="text-3xl font-bold text-primary">{seenWords.length}</p>
                  <p className="text-sm text-muted-foreground">{t.stats_learned}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <p className="text-3xl font-bold text-destructive">{difficultWords.length}</p>
                  <p className="text-sm text-muted-foreground">{t.stats_incorrect}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {t.stats_per_niveau}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {niveauStats.map(([niveau, data]) => {
                  const progressPercentage = data.total > 0 ? Math.round((data.seen / data.total) * 100) : 0;
                  const totalAttempts = data.correct + data.incorrect;
                  const successRate = totalAttempts > 0 ? Math.round((data.correct / totalAttempts) * 100) : 0;
                  
                  return (
                    <div key={niveau} className="p-4 rounded-lg bg-secondary/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">{niveau}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.seen} / {data.total} {t.stats_learned.toLowerCase()}
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <div className="flex gap-4 text-sm">
                        <span className="text-success">
                          ✓ {data.correct}
                        </span>
                        <span className="text-destructive">
                          ✗ {data.incorrect}
                        </span>
                        {totalAttempts > 0 && (
                          <span className="text-muted-foreground">
                            ({successRate}% {t.quiz_correct.toLowerCase().replace('!', '')})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {niveauStats.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    {t.learn_no_words}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {t.stats_incorrect}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {difficultWords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  🎉
                </p>
              ) : (
                <div className="space-y-2">
                {difficultWords
                  .sort((a, b) => (b.incorrect_count - (b.correct_count || 0)) - (a.incorrect_count - (a.correct_count || 0)))
                  .map((word) => (
                    <div
                      key={word.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-destructive/20"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-semibold text-primary">{word.source_word}</span>
                        <span className="text-sm text-muted-foreground">{word.translation}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                          {word.incorrect_count}x ✗
                        </span>
                        <span className="text-sm font-medium text-success bg-success/10 px-2 py-1 rounded">
                          {word.correct_count || 0}x ✓
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conjugations Tab */}
        <TabsContent value="conjugations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t.stats_title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <p className="text-3xl font-bold text-primary">{seenConjugations.length}</p>
                  <p className="text-sm text-muted-foreground">{t.stats_learned}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <p className="text-3xl font-bold text-destructive">{difficultConjugations.length}</p>
                  <p className="text-sm text-muted-foreground">{t.stats_incorrect}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {t.nav_learn_conjugations}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">{t.nav_learn_conjugations}</span>
                  <span className="text-sm text-muted-foreground">
                    {seenConjugations.length} / {conjugations.length} {t.stats_learned.toLowerCase()}
                  </span>
                </div>
                <Progress value={conjugations.length > 0 ? Math.round((seenConjugations.length / conjugations.length) * 100) : 0} className="h-2" />
                <div className="flex gap-4 text-sm">
                  <span className="text-success">
                    ✓ {conjugationStats.totalCorrect}
                  </span>
                  <span className="text-destructive">
                    ✗ {conjugationStats.totalIncorrect}
                  </span>
                  {(conjugationStats.totalCorrect + conjugationStats.totalIncorrect) > 0 && (
                    <span className="text-muted-foreground">
                      ({Math.round((conjugationStats.totalCorrect / (conjugationStats.totalCorrect + conjugationStats.totalIncorrect)) * 100)}% {t.quiz_correct.toLowerCase().replace('!', '')})
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Geleerd per tijdsvorm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conjugationTenseStats.map(([tense, data]) => {
                  const progressPercentage = data.total > 0 ? Math.round((data.seen / data.total) * 100) : 0;
                  
                  return (
                    <div key={tense} className="p-4 rounded-lg bg-secondary/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">{TENSE_LABELS[tense]}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.seen} / {data.total} {t.stats_learned.toLowerCase()}
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  );
                })}
                {conjugationTenseStats.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Geen vervoegingen beschikbaar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {t.stats_incorrect}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {difficultConjugations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  🎉
                </p>
              ) : (
                <div className="space-y-2">
                {difficultConjugations
                  .sort((a, b) => {
                    const diffA = (a.progress?.incorrect_count || 0) - (a.progress?.correct_count || 0);
                    const diffB = (b.progress?.incorrect_count || 0) - (b.progress?.correct_count || 0);
                    return diffB - diffA;
                  })
                  .map((conj) => (
                    <div
                      key={conj.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-destructive/20"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-semibold text-primary">{conj.infinitive}</span>
                        <span className="text-sm text-muted-foreground">{conj.translation}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                          {conj.progress?.incorrect_count || 0}x ✗
                        </span>
                        <span className="text-sm font-medium text-success bg-success/10 px-2 py-1 rounded">
                          {conj.progress?.correct_count || 0}x ✓
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
