import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
  { code: "nl", name: "Nederlands" },
  { code: "en", name: "Engels" },
  { code: "de", name: "Duits" },
  { code: "fr", name: "Frans" },
  { code: "es", name: "Spaans" },
  { code: "it", name: "Italiaans" },
  { code: "pt", name: "Portugees" },
  { code: "pl", name: "Pools" },
  { code: "ru", name: "Russisch" },
  { code: "zh", name: "Chinees" },
  { code: "ja", name: "Japans" },
  { code: "ko", name: "Koreaans" },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  excludeLanguage?: string;
}

export function LanguageSelector({
  value,
  onChange,
  label,
  excludeLanguage,
}: LanguageSelectorProps) {
  const filteredLanguages = excludeLanguage
    ? languages.filter((lang) => lang.code !== excludeLanguage)
    : languages;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecteer taal" />
        </SelectTrigger>
        <SelectContent>
          {filteredLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function getLanguageName(code: string): string {
  return languages.find((lang) => lang.code === code)?.name || code;
}
