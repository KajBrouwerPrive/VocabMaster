import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuizResults, type QuizResultRecord } from "@/lib/api";
import { Loader2, Trophy, TrendingUp, Target, Award, Calendar, BookOpen, Languages, Type, Hash, Layers, X } from "lucide-react";
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

type StatCategory = 'total' | 'average' | 'bronze' | 'silver' | 'gold' | null;

export function QuizStatistics() {
  const { t } = useLanguage();
  const [results, setResults] = useState<QuizResultRecord[]>([]);
  const [allResults, setAllResults] = useState<QuizResultRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<StatCategory>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allResultsData = await getQuizResults();
      setAllResults(allResultsData);
      setResults(allResultsData.slice(0, 5)); // Only show last 5 in recent
    } catch (error) {
      console.error("Error loading quiz statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats with breakdown
  const stats = useMemo(() => {
    const qualifyingResults = allResults.filter(r => r.total_questions >= 10);
    
    const wordsResults = allResults.filter(r => r.quiz_type === 'words');
    const conjugationsResults = allResults.filter(r => r.quiz_type === 'conjugations');
    
    const qualifyingWords = qualifyingResults.filter(r => r.quiz_type === 'words');
    const qualifyingConj = qualifyingResults.filter(r => r.quiz_type === 'conjugations');

    return {
      total: {
        all: allResults.length,
        words: wordsResults.length,
        conjugations: conjugationsResults.length,
      },
      average: {
        all: allResults.length > 0 
          ? Math.round(allResults.reduce((sum, r) => sum + Number(r.score_percentage), 0) / allResults.length)
          : 0,
        words: wordsResults.length > 0
          ? Math.round(wordsResults.reduce((sum, r) => sum + Number(r.score_percentage), 0) / wordsResults.length)
          : 0,
        conjugations: conjugationsResults.length > 0
          ? Math.round(conjugationsResults.reduce((sum, r) => sum + Number(r.score_percentage), 0) / conjugationsResults.length)
          : 0,
      },
      bronze: {
        all: qualifyingResults.filter(r => r.score_percentage >= 80 && r.score_percentage < 90).length,
        words: qualifyingWords.filter(r => r.score_percentage >= 80 && r.score_percentage < 90).length,
        conjugations: qualifyingConj.filter(r => r.score_percentage >= 80 && r.score_percentage < 90).length,
      },
      silver: {
        all: qualifyingResults.filter(r => r.score_percentage >= 90 && r.score_percentage < 100).length,
        words: qualifyingWords.filter(r => r.score_percentage >= 90 && r.score_percentage < 100).length,
        conjugations: qualifyingConj.filter(r => r.score_percentage >= 90 && r.score_percentage < 100).length,
      },
      gold: {
        all: qualifyingResults.filter(r => r.score_percentage === 100).length,
        words: qualifyingWords.filter(r => r.score_percentage === 100).length,
        conjugations: qualifyingConj.filter(r => r.score_percentage === 100).length,
      },
    };
  }, [allResults]);

  const handleCardClick = (category: StatCategory) => {
    setSelectedCategory(selectedCategory === category ? null : category);
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

  if (allResults.length === 0) {
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

  const renderBreakdown = (category: StatCategory) => {
    if (selectedCategory !== category || !category) return null;
    
    const data = stats[category];
    const isPercentage = category === 'average';
    
    return (
      <div className="mt-3 pt-3 border-t border-current/10 space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Woorden
          </span>
          <span className="font-semibold">{data.words}{isPercentage ? '%' : ''}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Languages className="h-3 w-3" /> Vervoegingen
          </span>
          <span className="font-semibold">{data.conjugations}{isPercentage ? '%' : ''}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card 
          className={`bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200/50 dark:border-teal-800/30 shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedCategory === 'total' ? 'ring-2 ring-teal-500' : ''}`}
          onClick={() => handleCardClick('total')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-500/15 rounded-xl shrink-0">
                <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-teal-700 dark:text-teal-300 truncate">{stats.total.all}</p>
                <p className="text-xs text-teal-600/70 dark:text-teal-400/70 truncate">Totaal toetsen</p>
              </div>
            </div>
            {renderBreakdown('total')}
          </CardContent>
        </Card>

        <Card 
          className={`bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedCategory === 'average' ? 'ring-2 ring-emerald-500' : ''}`}
          onClick={() => handleCardClick('average')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/15 rounded-xl shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 truncate">{stats.average.all}%</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">Gem. score</p>
              </div>
            </div>
            {renderBreakdown('average')}
          </CardContent>
        </Card>

        {/* Bronze - 80% */}
        <Card 
          className={`bg-gradient-to-br from-orange-100 to-amber-100/50 dark:from-orange-950/40 dark:to-amber-900/30 border-orange-300/50 dark:border-orange-700/40 shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedCategory === 'bronze' ? 'ring-2 ring-orange-500' : ''}`}
          onClick={() => handleCardClick('bronze')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-600/15 rounded-xl shrink-0">
                <Target className="h-4 w-4 text-orange-700 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-orange-800 dark:text-orange-300 truncate">{stats.bronze.all}</p>
                <p className="text-xs text-orange-700/70 dark:text-orange-400/70 truncate">Boven 80%</p>
              </div>
            </div>
            {renderBreakdown('bronze')}
          </CardContent>
        </Card>

        {/* Silver - 90% */}
        <Card 
          className={`bg-gradient-to-br from-slate-100 to-gray-200/50 dark:from-slate-800/50 dark:to-gray-700/30 border-slate-300/60 dark:border-slate-600/40 shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedCategory === 'silver' ? 'ring-2 ring-slate-500' : ''}`}
          onClick={() => handleCardClick('silver')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-400/20 rounded-xl shrink-0">
                <Award className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-slate-700 dark:text-slate-200 truncate">{stats.silver.all}</p>
                <p className="text-xs text-slate-600/70 dark:text-slate-400/70 truncate">Boven 90%</p>
              </div>
            </div>
            {renderBreakdown('silver')}
          </CardContent>
        </Card>

        {/* Gold - 100% */}
        <Card 
          className={`bg-gradient-to-br from-yellow-100 to-amber-200/60 dark:from-yellow-900/40 dark:to-amber-800/30 border-yellow-400/50 dark:border-yellow-600/40 shadow-sm hover:shadow-md transition-all cursor-pointer col-span-2 sm:col-span-1 ${selectedCategory === 'gold' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => handleCardClick('gold')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-500/20 rounded-xl shrink-0">
                <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300 truncate">{stats.gold.all}</p>
                <p className="text-xs text-yellow-700/70 dark:text-yellow-400/70 truncate">100% scores</p>
              </div>
            </div>
            {renderBreakdown('gold')}
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
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.score_percentage === 100
                    ? "bg-gradient-to-r from-yellow-100/50 to-amber-200/30 dark:from-yellow-900/20 dark:to-amber-800/15 border-yellow-400/50 dark:border-yellow-600/40"
                    : result.score_percentage >= 90
                    ? "bg-gradient-to-r from-slate-100/50 to-gray-200/30 dark:from-slate-800/30 dark:to-gray-700/20 border-slate-300/60 dark:border-slate-600/40"
                    : result.score_percentage >= 80
                    ? "bg-gradient-to-r from-orange-100/50 to-amber-100/30 dark:from-orange-950/20 dark:to-amber-900/15 border-orange-300/50 dark:border-orange-700/40"
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
                      ? "text-yellow-700 dark:text-yellow-300"
                      : result.score_percentage >= 90
                      ? "text-slate-700 dark:text-slate-200"
                      : result.score_percentage >= 80
                      ? "text-orange-800 dark:text-orange-300"
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
