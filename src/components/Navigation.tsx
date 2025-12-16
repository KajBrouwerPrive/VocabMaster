import { Book, GraduationCap, Plus, Brain, FileSpreadsheet, BarChart3, GitBranch, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "learn" | "quiz" | "quiz-conjugations" | "add" | "suggest" | "import-words" | "import-conjugations" | "stats" | "conjugations" | "add-conjugation" | "request-conjugation" | "admin";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
}

export function Navigation({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const lerenItems = [
    { id: "learn" as View, label: "Woordjes", icon: Book, adminOnly: false, userOnly: false },
    { id: "conjugations" as View, label: "Vervoegingen", icon: GitBranch, adminOnly: false, userOnly: false },
  ];

  const toetsenItems = [
    { id: "quiz" as View, label: "Toets Woordjes", icon: GraduationCap, adminOnly: false, userOnly: false },
    { id: "quiz-conjugations" as View, label: "Toets Vervoegingen", icon: GraduationCap, adminOnly: false, userOnly: false },
    { id: "stats" as View, label: "Statistieken", icon: BarChart3, adminOnly: false, userOnly: false },
  ];

  const toevoegenItems = [
    { id: "add" as View, label: "Woord +", icon: Plus, adminOnly: false, userOnly: false },
    { id: "add-conjugation" as View, label: "Werkwoord +", icon: Plus, adminOnly: true, userOnly: false },
    { id: "request-conjugation" as View, label: "Werkwoord Aanvragen", icon: Send, adminOnly: false, userOnly: true },
    { id: "admin" as View, label: "Admin", icon: Settings, adminOnly: true, userOnly: false },
    { id: "suggest" as View, label: "AI Suggesties", icon: Brain, adminOnly: true, userOnly: false },
    { id: "import-words" as View, label: "Import Woorden", icon: FileSpreadsheet, adminOnly: true, userOnly: false },
    { id: "import-conjugations" as View, label: "Import Werkwoorden", icon: FileSpreadsheet, adminOnly: true, userOnly: false },
  ];

  const filterItems = (items: typeof lerenItems) => 
    items.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.userOnly && isAdmin) return false;
      return true;
    });

  const renderColumn = (title: string, items: typeof lerenItems) => {
    const filtered = filterItems(items);
    if (filtered.length === 0) return null;
    
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">{title}</span>
        <div className="flex flex-col gap-1">
          {filtered.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "outline"}
              onClick={() => onViewChange(item.id)}
              className="gap-2 justify-start"
              size="sm"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <nav className="p-4">
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        {renderColumn("Leren", lerenItems)}
        {renderColumn("Toetsen", toetsenItems)}
        {renderColumn("Toevoegen", toevoegenItems)}
      </div>
    </nav>
  );
}
