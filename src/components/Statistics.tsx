import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWordsWithProgress, type WordWithProgress } from "@/lib/api";
import { toast } from "sonner";
import { BarChart3, AlertTriangle, Loader2 } from "lucide-react";
import { getLanguageName } from "@/components/LanguageSelector";

export function Statistics() {
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
      toast.error("Statistieken laden mislukt");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter words with more than 2 incorrect answers
  const difficultWords = words.filter((word) => word.incorrect_count > 2);

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
            Statistieken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-3xl font-bold text-primary">{words.length}</p>
              <p className="text-sm text-muted-foreground">Totaal woorden</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <p className="text-3xl font-bold text-destructive">{difficultWords.length}</p>
              <p className="text-sm text-muted-foreground">Moeilijke woorden</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Moeilijke woorden
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Woorden die meer dan 2x fout zijn gegaan bij een toets
          </p>
        </CardHeader>
        <CardContent>
          {difficultWords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Geen moeilijke woorden gevonden. Goed bezig!
            </p>
          ) : (
            <div className="space-y-2">
              {difficultWords
                .sort((a, b) => b.incorrect_count - a.incorrect_count)
                .map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-destructive/20"
                  >
                    <div className="grid grid-cols-[80px_1fr_80px] items-center gap-2 flex-1">
                      <span className="text-xs text-muted-foreground text-right">
                        {getLanguageName(word.source_language)}
                      </span>
                      <span className="font-medium text-primary">{word.source_word}</span>
                      <div></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        → {word.translation}
                      </span>
                      <span className="text-sm font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                        {word.incorrect_count}x fout
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
