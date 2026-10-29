import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, AppLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const appLanguages = [
  { code: 'nl' as AppLanguage, name: 'Nederlands', flag: '🇳🇱' },
  { code: 'en' as AppLanguage, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as AppLanguage, name: 'Français', flag: '🇫🇷' },
  { code: 'es' as AppLanguage, name: 'Español', flag: '🇪🇸' },
];

export function AppLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="hidden sm:block h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Select value={language} onValueChange={(value) => setLanguage(value as AppLanguage)}>
        <SelectTrigger className="w-[124px] sm:w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {appLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
