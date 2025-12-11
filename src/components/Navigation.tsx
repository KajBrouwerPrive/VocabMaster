import { Book, GraduationCap, Plus, Brain, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "learn" | "quiz" | "add" | "suggest" | "import";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: "learn" as View, label: "Leren", icon: Book },
    { id: "quiz" as View, label: "Toets", icon: GraduationCap },
    { id: "add" as View, label: "Toevoegen", icon: Plus },
    { id: "suggest" as View, label: "AI Suggesties", icon: Brain },
    { id: "import" as View, label: "Importeren", icon: FileSpreadsheet },
  ];

  return (
    <nav className="flex flex-wrap justify-center gap-2 p-4">
      {navItems.map((item) => (
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
