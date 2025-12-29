import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuizResults, getQuizStatistics, type QuizResultRecord } from "@/lib/api";
import { Loader2, Trophy, TrendingUp, Target, Award, Calendar, BookOpen, Languages, Type, Hash, Layers } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

const TENSE_LABELS: Record<string, string> = {
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

const NIVEAU_LABELS: Record<string, string> = {
  A: "A (A1/A2)",
  B: "B (B1/B2)",
  C: "C (C1/C2)",
  difficult: "Moeilijke woorden",
  all: "Alle",
};

export function QuizStatistics() {
  const { t } = useLanguage();
  const [results, setResults] = useState<QuizResultRecord[]>([]);
  const [stats, setStats] = useState<{
    totalQuizzes: number;
    above80Count: number;
    above90Count: number;
    perfectCount: number;
    averageScore: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resultsData, statsData] = await Promise.all([
        getQuizResults(),
        getQuizStatistics(),
      ]);
      setResults(resultsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading quiz statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalQuizzes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Toetsstatistieken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nog geen toetsen gemaakt. Maak een toets om je statistieken te zien!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200/50 dark:border-teal-800/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/15 rounded-xl">
                <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{stats.totalQuizzes}</p>
                <p className="text-xs text-teal-600/70 dark:text-teal-400/70">Totaal toetsen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/15 rounded-xl">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.averageScore}%</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Gemiddelde score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/15 rounded-xl">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.above80Count}</p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">Boven 80%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/15 rounded-xl">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.above90Count}</p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Boven 90%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/30 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/15 rounded-xl">
                <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.perfectCount}</p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70">100% scores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recente toetsen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.slice(0, 50).map((result) => (
              <div
                key={result.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.score_percentage === 100
                    ? "bg-amber-500/5 border-amber-500/20"
                    : result.score_percentage >= 90
                    ? "bg-yellow-500/5 border-yellow-500/20"
                    : result.score_percentage >= 80
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-secondary/30 border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    result.quiz_type === 'words' 
                      ? 'bg-primary/10' 
                      : 'bg-purple-500/10'
                  }`}>
                    {result.quiz_type === 'words' ? (
                      <BookOpen className={`h-4 w-4 ${
                        result.quiz_type === 'words' ? 'text-primary' : 'text-purple-500'
                      }`} />
                    ) : (
                      <Languages className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {result.quiz_type === 'words' ? 'Woordentoets' : 'Vervoegingentoets'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1" title="Datum">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(result.created_at), "d MMM yyyy", { locale: nl })}
                      </span>
                      <span className="flex items-center gap-1" title="Aantal vragen">
                        <Hash className="h-3 w-3" />
                        {result.total_questions}
                      </span>
                      {result.quiz_type === 'words' && (
                        <span className="flex items-center gap-1" title="Niveau">
                          <Layers className="h-3 w-3" />
                          {result.niveau === 'difficult' ? 'MW' : result.niveau === 'all' || !result.niveau ? 'All' : result.niveau}
                        </span>
                      )}
                      {result.thema && (
                        <span className="truncate max-w-[100px]" title={result.thema}>
                          {result.thema}
                        </span>
                      )}
                      {result.tenses && result.tenses.length > 0 && (
                        <span className="truncate max-w-[150px]" title={result.tenses.map(t => TENSE_LABELS[t] || t).join(", ")}>
                          {result.tenses.map(t => TENSE_LABELS[t] || t).join(", ")}
                        </span>
                      )}
                      {result.quiz_type === 'words' && (
                        <span className="flex items-center gap-1" title={result.ignore_accents ? "Accenten genegeerd" : "Met accenten"}>
                          <Type className={`h-3 w-3 ${result.ignore_accents ? 'text-primary' : 'text-muted-foreground/50'}`} />
                          {result.ignore_accents ? 'Á→A' : 'Á=Á'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {result.correct_answers}/{result.total_questions}
                  </span>
                  <span className={`text-lg font-bold ${
                    result.score_percentage === 100
                      ? "text-amber-500"
                      : result.score_percentage >= 90
                      ? "text-yellow-500"
                      : result.score_percentage >= 80
                      ? "text-green-500"
                      : "text-foreground"
                  }`}>
                    {result.score_percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
