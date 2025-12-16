import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSelector } from "@/components/LanguageSelector";
import { translateWord, addWord, Word } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, Check } from "lucide-react";
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
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Word[]>([]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search for existing words when typing 3+ characters
  useEffect(() => {
    if (isAdmin) return; // Skip for admins

    const searchWords = async () => {
      if (word.trim().length < 3) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("words")
          .select("*")
          .eq("shared", "Yes")
          .eq("source_language", sourceLanguage)
          .eq("target_language", targetLanguage)
          .ilike("source_word", `${word.trim()}%`)
          .limit(10);

        if (error) throw error;

        setSearchResults(data || []);
        setShowDropdown((data || []).length > 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchWords, 300);
    return () => clearTimeout(debounce);
  }, [word, sourceLanguage, targetLanguage, isAdmin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset when word changes manually
  useEffect(() => {
    if (!selectedWord || word !== selectedWord.source_word) {
      setSelectedWord(null);
      setTranslation("");
      setWordType("");
    }
  }, [word]);

  const handleSelectWord = (selectedWordItem: Word) => {
    setWord(selectedWordItem.source_word);
    setTranslation(selectedWordItem.translation);
    setWordType(selectedWordItem.word_type || "");
    setSelectedWord(selectedWordItem);
    setShowDropdown(false);
    toast.success("Woord geselecteerd!");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If user selected an existing word, just confirm
    if (selectedWord) {
      toast.success("Dit woord is al beschikbaar in de algemene set!");
      setWord("");
      setTranslation("");
      setWordType("");
      setSelectedWord(null);
      onWordAdded();
      return;
    }

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
      setSelectedWord(null);
      onWordAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Toevoegen mislukt");
    } finally {
      setIsAdding(false);
    }
  };

  const showManualEntry = isAdmin || (word.trim().length >= 3 && searchResults.length === 0 && !isSearching && !selectedWord);

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

          <div className="space-y-2 relative">
            <label className="text-sm font-medium">Woord</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Voer woord in (min. 3 letters)..."
                  className="w-full"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                
                {/* Autocomplete dropdown */}
                {!isAdmin && showDropdown && searchResults.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelectWord(result)}
                        className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium">{result.source_word}</span>
                        <span className="text-sm text-muted-foreground">{result.translation}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {isAdmin && (
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
            
            {!isAdmin && word.trim().length > 0 && word.trim().length < 3 && (
              <p className="text-xs text-muted-foreground">Typ nog {3 - word.trim().length} letter(s) om te zoeken</p>
            )}
          </div>

          {/* Show selected existing word */}
          {!isAdmin && selectedWord && (
            <div className="p-4 border rounded-lg bg-primary/10 space-y-2">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <Check className="h-4 w-4" />
                Woord geselecteerd
              </p>
              <p className="text-sm">
                <span className="font-semibold">{selectedWord.source_word}</span> → {selectedWord.translation}
              </p>
              <Button
                type="submit"
                variant="hero"
                size="sm"
                className="w-full"
              >
                Bevestigen
              </Button>
            </div>
          )}

          {/* Show manual entry form if word not found or user is admin */}
          {showManualEntry && (
            <>
              {!isAdmin && (
                <p className="text-sm text-muted-foreground">
                  Woord niet gevonden. Voeg het zelf toe:
                </p>
              )}
              
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
        </form>
      </CardContent>
    </Card>
  );
}
