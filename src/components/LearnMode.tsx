import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWords, markWordAsSeen, deleteWord, type Word } from "@/lib/api";
import { toast } from "sonner";
import {
  Book,
  Eye,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { getLanguageName } from "@/components/LanguageSelector";

interface LearnModeProps {
  refreshTrigger: number;
}

export function LearnMode({ refreshTrigger }: LearnModeProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, [refreshTrigger]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && words.length > 0) {
        if (!showTranslation) {
          setShowTranslation(true);
        } else {
          if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowTranslation(false);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTranslation, currentIndex, words.length]);

  const loadWords = async () => {
    setIsLoading(true);
    try {
      const data = await getWords();
      setWords(data);
      setCurrentIndex(0);
      setShowTranslation(false);
    } catch (error) {
      toast.error("Woorden laden mislukt");
    } finally {
      setIsLoading(false);
    }
  };

  const currentWord = words[currentIndex];

  const handleMarkAsSeen = async () => {
    if (!currentWord || currentWord.seen) return;

    try {
      await markWordAsSeen(currentWord.id);
      setWords((prev) =>
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
      setWords((prev) => prev.filter((w) => w.id !== currentWord.id));
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
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Word Card */}
        <div
          className="relative min-h-[200px] rounded-xl bg-secondary/50 p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-secondary/70"
          onClick={() => setShowTranslation(!showTranslation)}
        >
          {currentWord.seen && (
            <div className="absolute top-4 right-4">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-2">
            {getLanguageName(currentWord.source_language)}
          </p>
          <h2 className="text-3xl font-bold text-center mb-4">
            {currentWord.source_word}
          </h2>

          <div
            className={`transition-all duration-300 ${
              showTranslation ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
          >
            <p className="text-xs text-muted-foreground mb-1">
              {getLanguageName(currentWord.target_language)}
            </p>
            <p className="text-2xl text-primary font-medium">
              {currentWord.translation}
            </p>
          </div>

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
