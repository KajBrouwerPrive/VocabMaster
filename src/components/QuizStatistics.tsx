import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuizResults, type QuizResultRecord } from "@/lib/api";
import { Loader2, Trophy, TrendingUp, Target, Award, Calendar, BookOpen, Languages, Type, Hash, Layers } from "lucide-react";
import { format } from "date-fns";
import { nl, enUS, fr, es } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

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
  const { t, language } = useLanguage();
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

  // Chart data - group by date and calculate averages per niveau
  const chartData = useMemo(() => {
    if (allResults.length === 0) return [];
    
    const dateLocale = language === 'nl' ? nl : language === 'fr' ? fr : language === 'es' ? es : enUS;
    
    // Group results by date
    const groupedByDate = new Map<string, QuizResultRecord[]>();
    
    [...allResults]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach((result) => {
        const dateKey = format(new Date(result.created_at), "yyyy-MM-dd");
        if (!groupedByDate.has(dateKey)) {
          groupedByDate.set(dateKey, []);
        }
        groupedByDate.get(dateKey)!.push(result);
      });
    
    // Calculate averages per date per niveau
    return Array.from(groupedByDate.entries()).map(([dateKey, dayResults]) => {
      const calcAverage = (results: QuizResultRecord[]) => 
        results.length > 0 
          ? Math.round(results.reduce((sum, r) => sum + r.score_percentage, 0) / results.length) 
          : undefined;
      
      const niveauA = dayResults.filter(r => r.niveau === 'A');
      const niveauB = dayResults.filter(r => r.niveau === 'B');
      const niveauC = dayResults.filter(r => r.niveau === 'C');
      const difficult = dayResults.filter(r => r.niveau === 'difficult');
      
      return {
        name: format(new Date(dateKey), "d MMM", { locale: dateLocale }),
        overall: calcAverage(dayResults),
        niveauA: calcAverage(niveauA),
        niveauB: calcAverage(niveauB),
        niveauC: calcAverage(niveauC),
        difficult: calcAverage(difficult),
      };
    });
  }, [allResults, language]);

  // Legend labels mapping
  const chartLegendLabels = useMemo(() => ({
    overall: t.stats_overall,
    niveauA: t.stats_niveau_a,
    niveauB: t.stats_niveau_b,
    niveauC: t.stats_niveau_c,
    difficult: t.stats_difficult,
  }), [t]);

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
            {t.stats_quiz_title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t.stats_no_quizzes} {t.stats_no_quizzes_hint}
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderBreakdown = (category: StatCategory) => {
    if (selectedCategory !== category || !category) return null;
    
    const data = stats[category];
    const isPercentage = category === 'average';
    const isMedal = category === 'bronze' || category === 'silver' || category === 'gold';
    
    // For medal categories, calculate percentage based on words/conjugations totals
    const wordsTotal = stats.total.words;
    const conjTotal = stats.total.conjugations;
    
    return (
      <div className="mt-3 pt-3 border-t border-current/10 space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {t.common_words}
          </span>
          <span className="font-semibold">
            {data.words}{isPercentage ? '%' : ''}
            {isMedal && wordsTotal > 0 && (
              <span className="opacity-70 ml-1">({Math.round((data.words / wordsTotal) * 100)}%)</span>
            )}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Languages className="h-3 w-3" /> {t.nav_learn_conjugations}
          </span>
          <span className="font-semibold">
            {data.conjugations}{isPercentage ? '%' : ''}
            {isMedal && conjTotal > 0 && (
              <span className="opacity-70 ml-1">({Math.round((data.conjugations / conjTotal) * 100)}%)</span>
            )}
          </span>
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
                <p className="text-xs text-teal-600/70 dark:text-teal-400/70 truncate">{t.stats_total_quizzes}</p>
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
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">{t.stats_avg_score}</p>
              </div>
            </div>
            {renderBreakdown('average')}
          </CardContent>
        </Card>

        {/* Bronze - 80% */}
        <Card 
          className={`bg-gradient-to-br from-orange-200 via-amber-200 to-orange-300 dark:from-orange-800/60 dark:via-amber-700/50 dark:to-orange-800/60 border-orange-400 dark:border-orange-600 shadow-md shadow-orange-200/50 dark:shadow-orange-900/30 hover:shadow-lg hover:shadow-orange-300/50 transition-all cursor-pointer ${selectedCategory === 'bronze' ? 'ring-2 ring-orange-500' : ''}`}
          onClick={() => handleCardClick('bronze')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-600/25 rounded-xl shrink-0">
                <Target className="h-4 w-4 text-orange-800 dark:text-orange-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-orange-900 dark:text-orange-200 truncate">
                  {stats.bronze.all}
                  {stats.total.all > 0 && (
                    <span className="text-sm font-medium ml-1 opacity-70">
                      ({Math.round((stats.bronze.all / stats.total.all) * 100)}%)
                    </span>
                  )}
                </p>
                <p className="text-xs text-orange-800/80 dark:text-orange-300/80 truncate">{t.stats_above_80}</p>
              </div>
            </div>
            {renderBreakdown('bronze')}
          </CardContent>
        </Card>

        {/* Silver - 90% */}
        <Card 
          className={`bg-gradient-to-br from-slate-200 via-gray-300 to-slate-300 dark:from-slate-600/70 dark:via-gray-500/60 dark:to-slate-600/70 border-slate-400 dark:border-slate-500 shadow-md shadow-slate-300/50 dark:shadow-slate-800/40 hover:shadow-lg hover:shadow-slate-400/50 transition-all cursor-pointer ${selectedCategory === 'silver' ? 'ring-2 ring-slate-500' : ''}`}
          onClick={() => handleCardClick('silver')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-500/25 rounded-xl shrink-0">
                <Award className="h-4 w-4 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                  {stats.silver.all}
                  {stats.total.all > 0 && (
                    <span className="text-sm font-medium ml-1 opacity-70">
                      ({Math.round((stats.silver.all / stats.total.all) * 100)}%)
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-700/80 dark:text-slate-300/80 truncate">{t.stats_above_90}</p>
              </div>
            </div>
            {renderBreakdown('silver')}
          </CardContent>
        </Card>

        {/* Gold - 100% */}
        <Card 
          className={`shimmer-gold bg-gradient-to-br from-yellow-300 via-amber-300 to-yellow-400 dark:from-yellow-700/70 dark:via-amber-600/60 dark:to-yellow-700/70 border-yellow-500 dark:border-yellow-500 shadow-md shadow-yellow-300/50 dark:shadow-yellow-900/40 hover:shadow-lg hover:shadow-yellow-400/50 transition-all cursor-pointer col-span-2 sm:col-span-1 ${selectedCategory === 'gold' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => handleCardClick('gold')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-600/30 rounded-xl shrink-0">
                <Trophy className="h-4 w-4 text-yellow-800 dark:text-yellow-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100 truncate">
                  {stats.gold.all}
                  {stats.total.all > 0 && (
                    <span className="text-sm font-medium ml-1 opacity-70">
                      ({Math.round((stats.gold.all / stats.total.all) * 100)}%)
                    </span>
                  )}
                </p>
                <p className="text-xs text-yellow-800/80 dark:text-yellow-200/80 truncate">{t.stats_perfect_scores}</p>
              </div>
            </div>
            {renderBreakdown('gold')}
          </CardContent>
        </Card>
      </div>

      {/* Score Trend Chart */}
      {chartData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t.stats_score_trend}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => {
                      const label = chartLegendLabels[name as keyof typeof chartLegendLabels] || name;
                      return [`${value}%`, label];
                    }}
                  />
                  <Legend 
                    formatter={(value: string) => chartLegendLabels[value as keyof typeof chartLegendLabels] || value}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <ReferenceLine y={80} stroke="hsl(30, 80%, 50%)" strokeDasharray="5 5" strokeOpacity={0.3} />
                  <ReferenceLine y={90} stroke="hsl(210, 20%, 60%)" strokeDasharray="5 5" strokeOpacity={0.3} />
                  <ReferenceLine y={100} stroke="hsl(45, 90%, 50%)" strokeDasharray="5 5" strokeOpacity={0.3} />
                  {/* Overall line - primary color, thicker */}
                  <Line 
                    type="monotone" 
                    dataKey="overall" 
                    name="overall"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    connectNulls
                  />
                  {/* Niveau A - green */}
                  <Line 
                    type="monotone" 
                    dataKey="niveauA" 
                    name="niveauA"
                    stroke="hsl(150, 60%, 45%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(150, 60%, 45%)', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(150, 60%, 45%)' }}
                    connectNulls
                  />
                  {/* Niveau B - blue */}
                  <Line 
                    type="monotone" 
                    dataKey="niveauB" 
                    name="niveauB"
                    stroke="hsl(210, 70%, 50%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(210, 70%, 50%)', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(210, 70%, 50%)' }}
                    connectNulls
                  />
                  {/* Niveau C - purple */}
                  <Line 
                    type="monotone" 
                    dataKey="niveauC" 
                    name="niveauC"
                    stroke="hsl(270, 60%, 55%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(270, 60%, 55%)', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(270, 60%, 55%)' }}
                    connectNulls
                  />
                  {/* Difficult - red/orange */}
                  <Line 
                    type="monotone" 
                    dataKey="difficult" 
                    name="difficult"
                    stroke="hsl(0, 65%, 55%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(0, 65%, 55%)', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(0, 65%, 55%)' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t.stats_recent_quizzes}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result) => {
              const isGold = result.score_percentage === 100;
              const isSilver = result.score_percentage >= 90 && result.score_percentage < 100;
              const isBronze = result.score_percentage >= 80 && result.score_percentage < 90;
              const isGreen = result.score_percentage >= 60 && result.score_percentage < 80;
              const isRed = result.score_percentage < 60;

              return (
                <div
                  key={result.id}
                  className={`flex items-center justify-between p-3 rounded-lg border relative overflow-hidden ${
                    isGold
                      ? "bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-200 dark:from-yellow-800/40 dark:via-amber-700/30 dark:to-yellow-800/40 border-yellow-500 dark:border-yellow-500/60 shadow-md shadow-yellow-200/50 dark:shadow-yellow-900/30"
                      : isSilver
                      ? "bg-gradient-to-r from-slate-200 via-gray-100 to-slate-200 dark:from-slate-700/50 dark:via-gray-600/40 dark:to-slate-700/50 border-slate-400 dark:border-slate-400/60 shadow-md shadow-slate-200/50 dark:shadow-slate-800/30"
                      : isBronze
                      ? "bg-gradient-to-r from-orange-200 via-amber-100 to-orange-200 dark:from-orange-800/40 dark:via-amber-700/30 dark:to-orange-800/40 border-orange-500 dark:border-orange-500/60 shadow-md shadow-orange-200/50 dark:shadow-orange-900/30"
                      : isGreen
                      ? "bg-gradient-to-r from-emerald-100/50 to-green-100/30 dark:from-emerald-950/20 dark:to-green-900/15 border-emerald-300/50 dark:border-emerald-700/40"
                      : "bg-gradient-to-r from-red-100/50 to-rose-100/30 dark:from-red-950/20 dark:to-rose-900/15 border-red-300/50 dark:border-red-700/40"
                  }`}
                >
                  {/* Medal badge for 80%+ scores */}
                  {(isGold || isSilver || isBronze) && (
                    <div className={`absolute top-0 right-0 px-2 py-0.5 text-xs font-bold rounded-bl-lg flex items-center gap-1 ${
                      isGold
                        ? "bg-yellow-500 text-yellow-950"
                        : isSilver
                        ? "bg-slate-400 text-slate-950"
                        : "bg-orange-500 text-orange-950"
                    }`}>
                      {isGold ? <Trophy className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                      {isGold ? t.stats_gold : isSilver ? t.stats_silver : t.stats_bronze}
                    </div>
                  )}

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
                        {result.quiz_type === 'words' ? t.stats_words_quiz : t.stats_conjugations_quiz}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1" title="Datum">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(result.created_at), "d MMM yyyy", { locale: language === 'nl' ? nl : language === 'fr' ? fr : language === 'es' ? es : enUS })}
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
                    <span className={`text-xl font-black ${
                      isGold
                        ? "text-yellow-700 dark:text-yellow-300 drop-shadow-sm"
                        : isSilver
                        ? "text-slate-700 dark:text-slate-200 drop-shadow-sm"
                        : isBronze
                        ? "text-orange-700 dark:text-orange-300 drop-shadow-sm"
                        : isGreen
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-700 dark:text-red-300"
                    }`}>
                      {result.score_percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
