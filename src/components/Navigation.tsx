import { Book, GraduationCap, Plus, Brain, FileSpreadsheet, BarChart3, GitBranch, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "learn" | "quiz" | "quiz-conjugations" | "add" | "suggest" | "import-words" | "import-conjugations" | "stats" | "conjugations" | "add-conjugation" | "request-conjugation" | "admin";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
}

export function Navigation({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const navItems = [
    { id: "learn" as View, label: "Woordjes", icon: Book, adminOnly: false, userOnly: false },
    { id: "conjugations" as View, label: "Vervoegingen", icon: GitBranch, adminOnly: false, userOnly: false },
    { id: "quiz" as View, label: "Toets Woordjes", icon: GraduationCap, adminOnly: false, userOnly: false },
    { id: "quiz-conjugations" as View, label: "Toets Vervoegingen", icon: GraduationCap, adminOnly: false, userOnly: false },
    { id: "stats" as View, label: "Statistieken", icon: BarChart3, adminOnly: false, userOnly: false },
    { id: "add" as View, label: "Woord +", icon: Plus, adminOnly: false, userOnly: false },
    { id: "add-conjugation" as View, label: "Werkwoord +", icon: Plus, adminOnly: true, userOnly: false },
    { id: "request-conjugation" as View, label: "Werkwoord Aanvragen", icon: Send, adminOnly: false, userOnly: true },
    { id: "admin" as View, label: "Admin", icon: Settings, adminOnly: true, userOnly: false },
    { id: "suggest" as View, label: "AI Suggesties", icon: Brain, adminOnly: true, userOnly: false },
    { id: "import-words" as View, label: "Import Woorden", icon: FileSpreadsheet, adminOnly: true, userOnly: false },
    { id: "import-conjugations" as View, label: "Import Werkwoorden", icon: FileSpreadsheet, adminOnly: true, userOnly: false },
  ];

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.userOnly && isAdmin) return false;
    return true;
  });

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
