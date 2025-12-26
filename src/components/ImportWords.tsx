import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

interface ImportWordsProps {
  onWordsAdded: () => void;
}

interface ParsedWord {
  sourceWord: string;
  translation: string;
  wordType: string;
  niveau: string;
  thema: string;
}

export function ImportWords({ onWordsAdded }: ImportWordsProps) {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only admins can import words
  if (roleLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Laden...
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Alleen admins kunnen woorden importeren.
        </CardContent>
      </Card>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

        // Skip header row if it exists, parse data
        const words: ParsedWord[] = [];
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row[0] && row[1]) {
            // Check if first row looks like a header
            if (i === 0 && (row[0].toLowerCase().includes("woord") || row[0].toLowerCase().includes("dutch") || row[0].toLowerCase().includes("nederland"))) {
              continue;
            }
            words.push({
              sourceWord: String(row[0]).trim().toLowerCase(),
              translation: String(row[1]).trim().toLowerCase(),
              wordType: row[2] ? String(row[2]).trim().toLowerCase() : "",
              niveau: row[3] ? String(row[3]).trim() : "",
              thema: row[4] ? String(row[4]).trim() : "",
            });
          }
        }

        setParsedWords(words);
        toast.success(`${words.length} woorden gevonden in bestand`);
      } catch (error) {
        toast.error("Fout bij het lezen van het bestand");
        console.error(error);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedWords.length === 0) return;
    if (!user) {
      toast.error("Je moet ingelogd zijn");
      return;
    }

    setIsLoading(true);
    try {
      // Admin imports words with their user_id and shared='Yes' so everyone can see them
      const wordsToInsert = parsedWords.map((w) => ({
        source_word: w.sourceWord,
        source_language: "nl",
        translation: w.translation,
        target_language: "es",
        word_type: w.wordType || null,
        niveau: w.niveau || null,
        thema: w.thema || null,
        user_id: user.id,
        shared: "Yes",
      }));

      // Insert words one by one to handle duplicates gracefully
      let inserted = 0;
      let skipped = 0;

      for (const word of wordsToInsert) {
        const { error } = await supabase.from("words").insert(word);
        if (error) {
          // If duplicate key error, just skip this word
          if (error.code === "23505") {
            skipped++;
          } else {
            console.error("Error inserting word:", error);
            skipped++;
          }
        } else {
          inserted++;
        }
      }

      const message = skipped > 0 
        ? `${inserted} gedeelde woorden toegevoegd, ${skipped} duplicaten overgeslagen`
        : `${inserted} gedeelde woorden geïmporteerd`;
      toast.success(message);
      setParsedWords([]);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onWordsAdded();
    } catch (error: any) {
      toast.error(error.message || "Import mislukt");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setParsedWords([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Excel Importeren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload een Excel-bestand met 5 kolommen: A = Nederlands woord, B = Spaanse vertaling, C = Soort woord, D = Niveau, E = Thema
        </p>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {fileName || "Bestand kiezen"}
          </Button>
          {fileName && (
            <Button variant="ghost" size="icon" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {parsedWords.length > 0 && (
          <>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Nederlands</th>
                    <th className="p-2 text-left">Spaans</th>
                    <th className="p-2 text-left">Soort</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedWords.slice(0, 50).map((word, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{word.sourceWord}</td>
                      <td className="p-2">{word.translation}</td>
                      <td className="p-2 text-muted-foreground">{word.wordType || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedWords.length > 50 && (
                <p className="p-2 text-center text-muted-foreground text-sm">
                  ... en {parsedWords.length - 50} meer
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? "Importeren..." : `${parsedWords.length} woorden importeren`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
