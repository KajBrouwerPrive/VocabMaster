import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getWordSuggestions, addWords, type WordSuggestion } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Brain, Plus, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface SuggestWordsProps {
  onWordsAdded: () => void;
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
}

export function SuggestWords({
  onWordsAdded,
  defaultSourceLanguage,
  defaultTargetLanguage,
}: SuggestWordsProps) {
  const [sourceLanguage, setSourceLanguage] = useState(defaultSourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLanguage);
  const [category, setCategory] = useState("");
  const [count, setCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await getWordSuggestions(
        sourceLanguage,
        targetLanguage,
        category || undefined,
        count
      );
      setSuggestions(result);
      setSelectedWords(new Set(result.map((_, i) => i)));
      toast.success(`${result.length} suggesties opgehaald!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suggesties ophalen mislukt");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWord = (index: number) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedWords(newSelected);
  };

  const selectAll = () => {
    setSelectedWords(new Set(suggestions.map((_, i) => i)));
  };

  const selectNone = () => {
    setSelectedWords(new Set());
  };

  const handleAddSelected = async () => {
    const wordsToAdd = suggestions
      .filter((_, i) => selectedWords.has(i))
      .map((s) => ({ sourceWord: s.word, translation: s.translation }));

    if (wordsToAdd.length === 0) {
      toast.error("Selecteer minimaal één woord");
      return;
    }

    setIsAdding(true);
    try {
      await addWords(wordsToAdd, sourceLanguage, targetLanguage);
      toast.success(`${wordsToAdd.length} woorden toegevoegd!`);
      setSuggestions([]);
      setSelectedWords(new Set());
      onWordsAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Toevoegen mislukt");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Woordsuggesties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LanguageSelector
            value={sourceLanguage}
            onChange={setSourceLanguage}
            label="Brontaal"
            excludeLanguage={targetLanguage}
          />
          <LanguageSelector
            value={targetLanguage}
            onChange={setTargetLanguage}
            label="Doeltaal"
            excludeLanguage={sourceLanguage}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categorie (optioneel)</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="bijv. eten, reizen, sport..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Aantal woorden</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 10)}
            />
          </div>
        </div>

        <Button
          variant="hero"
          onClick={handleGetSuggestions}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          Genereer Suggesties
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedWords.size} van {suggestions.length} geselecteerd
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  <Check className="h-3 w-3 mr-1" />
                  Alles
                </Button>
                <Button variant="ghost" size="sm" onClick={selectNone}>
                  <X className="h-3 w-3 mr-1" />
                  Niets
                </Button>
              </div>
            </div>

            <div className="grid gap-2 max-h-80 overflow-y-auto pr-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedWords.has(index)
                      ? "bg-primary/5 border-primary/30"
                      : "bg-card border-border hover:bg-secondary/50"
                  }`}
                  onClick={() => toggleWord(index)}
                >
                  <Checkbox
                    checked={selectedWords.has(index)}
                    onCheckedChange={() => toggleWord(index)}
                  />
                  <span className="font-medium">{suggestion.word}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{suggestion.translation}</span>
                </div>
              ))}
            </div>

            <Button
              variant="success"
              onClick={handleAddSelected}
              disabled={isAdding || selectedWords.size === 0}
              className="w-full"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {selectedWords.size} Woorden Toevoegen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
