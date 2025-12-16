import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSelector } from "@/components/LanguageSelector";
import { translateWord, addWord, Word } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, Search, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";

const WORD_TYPES = [
  { value: "zelfstandig naamwoord", label: "zelfstandig naamwoord" },
  { value: "werkwoord", label: "werkwoord" },
  { value: "overig", label: "overig" },
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
  const { isAdmin } = useUserRole();
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [wordType, setWordType] = useState<string>("");
  const [sourceLanguage, setSourceLanguage] = useState(defaultSourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState("es"); // Default to Spanish
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [existingWord, setExistingWord] = useState<Word | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Reset search when word changes
  useEffect(() => {
    setExistingWord(null);
    setSearchPerformed(false);
    setTranslation("");
  }, [word]);

  const handleSearchExisting = async () => {
    if (!word.trim()) {
      toast.error("Voer eerst een woord in");
      return;
    }

    setIsSearching(true);
    try {
      // Search for shared words only
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("shared", "Yes")
        .eq("source_language", sourceLanguage)
        .eq("target_language", targetLanguage)
        .ilike("source_word", word.trim())
        .maybeSingle();

      if (error) throw error;

      setExistingWord(data);
      setSearchPerformed(true);

      if (data) {
        toast.success("Woord gevonden in de database!");
        setTranslation(data.translation);
        setWordType(data.word_type || "");
      } else {
        toast.info("Woord niet gevonden. Je kunt het zelf toevoegen.");
      }
    } catch (error) {
      toast.error("Zoeken mislukt");
    } finally {
      setIsSearching(false);
    }
  };

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

  const handleSelectExisting = async () => {
    if (!existingWord) return;

    // Word already exists, just notify the user
    toast.success("Dit woord is al beschikbaar in de algemene set!");
    setWord("");
    setTranslation("");
    setWordType("");
    setExistingWord(null);
    setSearchPerformed(false);
    onWordAdded();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!word.trim() || !translation.trim()) {
      toast.error("Vul alle velden in");
      return;
    }

    if (!wordType) {
      toast.error("Selecteer een woordsoort");
      return;
    }

    setIsAdding(true);
    try {
      await addWord(word, sourceLanguage, translation, targetLanguage, false, wordType);
      toast.success("Woord toegevoegd!");
      setWord("");
      setTranslation("");
      setWordType("");
      setExistingWord(null);
      setSearchPerformed(false);
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
              {!isAdmin ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSearchExisting}
                  disabled={isSearching || !word.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Zoek
                </Button>
              ) : (
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
              )}
            </div>
          </div>

          {/* Show existing word option for non-admins */}
          {!isAdmin && existingWord && searchPerformed && (
            <div className="p-4 border rounded-lg bg-primary/10 space-y-2">
              <p className="text-sm font-medium text-primary">Woord gevonden!</p>
              <p className="text-sm">
                <span className="font-semibold">{existingWord.source_word}</span> → {existingWord.translation}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectExisting}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Dit woord is al beschikbaar
              </Button>
            </div>
          )}

          {/* Show translation input only if word not found or user is admin */}
          {(isAdmin || (searchPerformed && !existingWord)) && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vertaling</label>
                <Input
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="Vertaling..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Woordsoort *</label>
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
                disabled={isAdding || !word.trim() || !translation.trim() || !wordType}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Toevoegen
              </Button>
            </>
          )}

          {/* Show prompt to search first for non-admins */}
          {!isAdmin && !searchPerformed && (
            <p className="text-sm text-muted-foreground text-center">
              Zoek eerst of het woord al bestaat in de database
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
