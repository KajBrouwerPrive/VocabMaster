import { Book, GraduationCap, Plus, Brain, FileSpreadsheet, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "learn" | "quiz" | "add" | "suggest" | "import" | "stats";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
}

export function Navigation({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const navItems = [
    { id: "learn" as View, label: "Leren", icon: Book, adminOnly: false },
    { id: "quiz" as View, label: "Toets", icon: GraduationCap, adminOnly: false },
    { id: "stats" as View, label: "Statistieken", icon: BarChart3, adminOnly: false },
    { id: "add" as View, label: "Toevoegen", icon: Plus, adminOnly: false },
    { id: "suggest" as View, label: "AI Suggesties", icon: Brain, adminOnly: true },
    { id: "import" as View, label: "Importeren", icon: FileSpreadsheet, adminOnly: true },
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
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
