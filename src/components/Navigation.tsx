import { Book, GraduationCap, Plus, Brain, FileSpreadsheet, BarChart3, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "learn" | "quiz" | "quiz-conjugations" | "add" | "suggest" | "import-words" | "import-conjugations" | "stats" | "conjugations" | "add-conjugation";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
}

export function Navigation({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const navItems = [
    { id: "learn" as View, label: "Woordjes", icon: Book, adminOnly: false },
    { id: "conjugations" as View, label: "Vervoegingen", icon: GitBranch, adminOnly: false },
    { id: "quiz" as View, label: "Toets Woordjes", icon: GraduationCap, adminOnly: false },
    { id: "quiz-conjugations" as View, label: "Toets Vervoegingen", icon: GraduationCap, adminOnly: false },
    { id: "stats" as View, label: "Statistieken", icon: BarChart3, adminOnly: false },
    { id: "add" as View, label: "Woord +", icon: Plus, adminOnly: false },
    { id: "add-conjugation" as View, label: "Werkwoord +", icon: Plus, adminOnly: false },
    { id: "suggest" as View, label: "AI Suggesties", icon: Brain, adminOnly: true },
    { id: "import-words" as View, label: "Import Woorden", icon: FileSpreadsheet, adminOnly: true },
    { id: "import-conjugations" as View, label: "Import Werkwoorden", icon: FileSpreadsheet, adminOnly: true },
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="flex flex-wrap justify-center gap-2 p-4">
      {visibleItems.map((item) => (
        <Button
          key={item.id}
          variant={currentView === item.id ? "default" : "outline"}
          onClick={() => onViewChange(item.id)}
          className="gap-2"
          size="sm"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
