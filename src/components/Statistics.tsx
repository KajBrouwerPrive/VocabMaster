import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWordsWithProgress, type WordWithProgress } from "@/lib/api";
import { toast } from "sonner";
import { BarChart3, AlertTriangle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";


export function Statistics() {
  const { t } = useLanguage();
  const [words, setWords] = useState<WordWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setIsLoading(true);
    try {
      const data = await getWordsWithProgress();
      setWords(data);
    } catch (error) {
      toast.error(t.common_error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter words that user has seen
  const seenWords = words.filter((word) => word.seen);

  // Filter words where incorrect - correct > 2
  const difficultWords = words.filter((word) => (word.incorrect_count - (word.correct_count || 0)) > 2);

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
    </div>
  );
}
