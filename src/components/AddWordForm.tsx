import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSelector } from "@/components/LanguageSelector";
import { translateWord, addWord } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WORD_TYPES = [
  { value: "zelfstandig naamwoord", label: "Zelfstandig naamwoord" },
  { value: "werkwoord", label: "Werkwoord" },
  { value: "overig", label: "Overig" },
];

interface AddWordFormProps {
  onWordAdded: () => void;
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
}

export function AddWordForm({
  onWordAdded,
  defaultSourceLanguage,
  defaultTargetLanguage,
}: AddWordFormProps) {
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [wordType, setWordType] = useState<string>("overig");
  const [sourceLanguage, setSourceLanguage] = useState(defaultSourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleTranslate = async () => {
    if (!word.trim()) {
      toast.error("Voer eerst een woord in");
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateWord(word, sourceLanguage, targetLanguage);
      setTranslation(result);
      toast.success("Vertaling opgehaald!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vertaling mislukt");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!word.trim() || !translation.trim()) {
      toast.error("Vul alle velden in");
      return;
    }

    setIsAdding(true);
    try {
      await addWord(word, sourceLanguage, translation, targetLanguage, false, wordType);
      toast.success("Woord toegevoegd!");
      setWord("");
      setTranslation("");
      setWordType("overig");
      onWordAdded();
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
          <Plus className="h-5 w-5 text-primary" />
          Woord Toevoegen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Woord</label>
            <div className="flex gap-2">
              <Input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Voer woord in..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleTranslate}
                disabled={isTranslating || !word.trim()}
              >
                {isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Vertaal
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vertaling</label>
            <Input
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Vertaling..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Woordsoort</label>
            <Select value={wordType} onValueChange={setWordType}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Selecteer woordsoort" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {WORD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            variant="hero"
            className="w-full"
            disabled={isAdding || !word.trim() || !translation.trim()}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Toevoegen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
