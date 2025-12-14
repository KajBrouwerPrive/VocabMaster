import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

interface ImportConjugationsProps {
  onConjugationsAdded: () => void;
}

interface ExcelRow {
  nlWerkwoord: string;
  esWerkwoord: string;
  tijd: string;
  persoon: string;
  nlVorm: string;
  esVorm: string;
}

interface ParsedConjugation {
  infinitive: string;
  translation: string;
  present_ik: string;
  present_jij: string;
  present_hij_zij: string;
  present_wij: string;
  present_jullie: string;
  past_ik: string;
  past_jij: string;
  past_hij_zij: string;
  past_wij: string;
  past_jullie: string;
  perfect_ik: string;
  perfect_jij: string;
  perfect_hij_zij: string;
  perfect_wij: string;
  perfect_jullie: string;
  indefinido_ik: string;
  indefinido_jij: string;
  indefinido_hij_zij: string;
  indefinido_wij: string;
  indefinido_jullie: string;
  futuro_ik: string;
  futuro_jij: string;
  futuro_hij_zij: string;
  futuro_wij: string;
  futuro_jullie: string;
  futuro_perfecto_ik: string;
  futuro_perfecto_jij: string;
  futuro_perfecto_hij_zij: string;
  futuro_perfecto_wij: string;
  futuro_perfecto_jullie: string;
  condicional_ik: string;
  condicional_jij: string;
  condicional_hij_zij: string;
  condicional_wij: string;
  condicional_jullie: string;
  pluscuamperfecto_ik: string;
  pluscuamperfecto_jij: string;
  pluscuamperfecto_hij_zij: string;
  pluscuamperfecto_wij: string;
  pluscuamperfecto_jullie: string;
  subjuntivo_presente_ik: string;
  subjuntivo_presente_jij: string;
  subjuntivo_presente_hij_zij: string;
  subjuntivo_presente_wij: string;
  subjuntivo_presente_jullie: string;
  subjuntivo_imperfecto_ik: string;
  subjuntivo_imperfecto_jij: string;
  subjuntivo_imperfecto_hij_zij: string;
  subjuntivo_imperfecto_wij: string;
  subjuntivo_imperfecto_jullie: string;
}

// Map Excel tense names to our database tense prefixes
const TENSE_MAP: Record<string, string> = {
  "tegenwoordige tijd (presente)": "present",
  "presente": "present",
  "verleden tijd onvoltooid (imperfecto)": "past",
  "imperfecto": "past",
  "voltooide tijd (pretérito perfecto compuesto)": "perfect",
  "pretérito perfecto compuesto": "perfect",
  "perfecto compuesto": "perfect",
  "verleden tijd (pretérito indefinido)": "indefinido",
  "pretérito indefinido": "indefinido",
  "indefinido": "indefinido",
  "toekomende tijd (futuro simple)": "futuro",
  "futuro simple": "futuro",
  "futuro": "futuro",
  "toekomende voltooide tijd (futuro perfecto)": "futuro_perfecto",
  "futuro perfecto": "futuro_perfecto",
  "voorwaardelijke wijs (condicional simple)": "condicional",
  "condicional simple": "condicional",
  "condicional": "condicional",
  "voltooide verleden tijd (pluscuamperfecto)": "pluscuamperfecto",
  "pluscuamperfecto": "pluscuamperfecto",
  "aanvoegende wijs tegenwoordige tijd (subjuntivo presente)": "subjuntivo_presente",
  "subjuntivo presente": "subjuntivo_presente",
  "aanvoegende wijs verleden tijd (subjuntivo imperfecto)": "subjuntivo_imperfecto",
  "subjuntivo imperfecto": "subjuntivo_imperfecto",
};

// Map Excel person names to our database person suffixes
const PERSON_MAP: Record<string, string> = {
  "ik": "ik",
  "jij": "jij",
  "hij/zij": "hij_zij",
  "wij": "wij",
  "jullie": "jullie",
};

const createEmptyConjugation = (infinitive: string, translation: string): ParsedConjugation => ({
  infinitive,
  translation,
  present_ik: "", present_jij: "", present_hij_zij: "", present_wij: "", present_jullie: "",
  past_ik: "", past_jij: "", past_hij_zij: "", past_wij: "", past_jullie: "",
  perfect_ik: "", perfect_jij: "", perfect_hij_zij: "", perfect_wij: "", perfect_jullie: "",
  indefinido_ik: "", indefinido_jij: "", indefinido_hij_zij: "", indefinido_wij: "", indefinido_jullie: "",
  futuro_ik: "", futuro_jij: "", futuro_hij_zij: "", futuro_wij: "", futuro_jullie: "",
  futuro_perfecto_ik: "", futuro_perfecto_jij: "", futuro_perfecto_hij_zij: "", futuro_perfecto_wij: "", futuro_perfecto_jullie: "",
  condicional_ik: "", condicional_jij: "", condicional_hij_zij: "", condicional_wij: "", condicional_jullie: "",
  pluscuamperfecto_ik: "", pluscuamperfecto_jij: "", pluscuamperfecto_hij_zij: "", pluscuamperfecto_wij: "", pluscuamperfecto_jullie: "",
  subjuntivo_presente_ik: "", subjuntivo_presente_jij: "", subjuntivo_presente_hij_zij: "", subjuntivo_presente_wij: "", subjuntivo_presente_jullie: "",
  subjuntivo_imperfecto_ik: "", subjuntivo_imperfecto_jij: "", subjuntivo_imperfecto_hij_zij: "", subjuntivo_imperfecto_wij: "", subjuntivo_imperfecto_jullie: "",
});

export function ImportConjugations({ onConjugationsAdded }: ImportConjugationsProps) {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [parsedConjugations, setParsedConjugations] = useState<ParsedConjugation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (roleLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Alleen admins kunnen vervoegingen importeren.
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

        // Parse Excel rows into structured data
        const rows: ExcelRow[] = [];
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row[0] || !row[1]) continue;
          
          // Skip header row
          if (i === 0 && (
            row[0].toLowerCase().includes("werkwoord") || 
            row[0].toLowerCase().includes("nl") ||
            row[2]?.toLowerCase().includes("tijd")
          )) {
            continue;
          }

          rows.push({
            nlWerkwoord: String(row[0]).trim(),
            esWerkwoord: String(row[1]).trim(),
            tijd: String(row[2] || "").trim().toLowerCase(),
            persoon: String(row[3] || "").trim().toLowerCase(),
            nlVorm: String(row[4] || "").trim(),
            esVorm: String(row[5] || "").trim(),
          });
        }

        // Group rows by verb (NL werkwoord + ES werkwoord)
        const verbMap = new Map<string, ParsedConjugation>();
        
        for (const row of rows) {
          const key = `${row.nlWerkwoord.toLowerCase()}|${row.esWerkwoord.toLowerCase()}`;
          
          if (!verbMap.has(key)) {
            verbMap.set(key, createEmptyConjugation(row.esWerkwoord, row.nlWerkwoord));
          }
          
          const conj = verbMap.get(key)!;
          const tenseKey = TENSE_MAP[row.tijd];
          const personKey = PERSON_MAP[row.persoon];
          
          if (tenseKey && personKey) {
            const fieldKey = `${tenseKey}_${personKey}` as keyof ParsedConjugation;
            if (fieldKey in conj) {
              (conj as any)[fieldKey] = row.esVorm;
            }
          }
        }

        const conjugations = Array.from(verbMap.values());
        setParsedConjugations(conjugations);
        toast.success(`${conjugations.length} werkwoorden gevonden in bestand`);
      } catch (error) {
        toast.error("Fout bij het lezen van het bestand");
        console.error(error);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedConjugations.length === 0) return;
    if (!user) {
      toast.error("Je moet ingelogd zijn");
      return;
    }

    setIsLoading(true);
    try {
      // Get existing conjugations to check for duplicates
      const { data: existingConj } = await supabase
        .from("verb_conjugations")
        .select("infinitive")
        .eq("source_language", "nl")
        .eq("target_language", "es");

      const existingSet = new Set(
        (existingConj || []).map((c) => c.infinitive.toLowerCase())
      );

      // Filter out duplicates
      const newConjugations = parsedConjugations.filter(
        (c) => !existingSet.has(c.infinitive.toLowerCase())
      );

      if (newConjugations.length === 0) {
        toast.info("Alle werkwoorden bestaan al");
        clearFile();
        return;
      }

      // Insert conjugations
      const toInsert = newConjugations.map((c) => ({
        ...c,
        source_language: "nl",
        target_language: "es",
        user_id: user.id,
        shared: "Yes",
      }));

      const { error } = await supabase.from("verb_conjugations").insert(toInsert);

      if (error) throw error;

      const skipped = parsedConjugations.length - newConjugations.length;
      const message = skipped > 0
        ? `${newConjugations.length} werkwoorden toegevoegd, ${skipped} duplicaten overgeslagen`
        : `${newConjugations.length} werkwoorden geïmporteerd`;
      toast.success(message);
      clearFile();
      onConjugationsAdded();
    } catch (error: any) {
      toast.error(error.message || "Import mislukt");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setParsedConjugations([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Count filled tenses for display
  const countFilledTenses = (conj: ParsedConjugation): number => {
    const tenses = ["present", "past", "perfect", "indefinido", "futuro", "futuro_perfecto", "condicional", "pluscuamperfecto", "subjuntivo_presente", "subjuntivo_imperfecto"];
    return tenses.filter((t) => (conj as any)[`${t}_ik`]).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Vervoegingen Importeren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload een Excel-bestand met kolommen: NL werkwoord, ES werkwoord, Tijd, Persoon, NL vorm, ES vorm
        </p>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="conjugation-excel-upload"
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

        {parsedConjugations.length > 0 && (
          <>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Infinitief (ES)</th>
                    <th className="p-2 text-left">Vertaling (NL)</th>
                    <th className="p-2 text-left">Tijden</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedConjugations.slice(0, 50).map((conj, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium">{conj.infinitive}</td>
                      <td className="p-2">{conj.translation}</td>
                      <td className="p-2 text-muted-foreground">{countFilledTenses(conj)}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedConjugations.length > 50 && (
                <p className="p-2 text-center text-muted-foreground text-sm">
                  ... en {parsedConjugations.length - 50} meer
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importeren...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {parsedConjugations.length} werkwoorden importeren
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
