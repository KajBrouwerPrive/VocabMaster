import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { LearnMode } from "@/components/LearnMode";
import { QuizMode } from "@/components/QuizMode";
import { AddWordForm } from "@/components/AddWordForm";
import { SuggestWords } from "@/components/SuggestWords";
import { Languages } from "lucide-react";

type View = "learn" | "quiz" | "add" | "suggest";

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("learn");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [defaultSourceLanguage] = useState("nl");
  const [defaultTargetLanguage] = useState("en");

  const handleWordsAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <Languages className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">VocabMaster</h1>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {currentView === "learn" && <LearnMode refreshTrigger={refreshTrigger} />}
        {currentView === "quiz" && <QuizMode />}
        {currentView === "add" && (
          <AddWordForm
            onWordAdded={handleWordsAdded}
            defaultSourceLanguage={defaultSourceLanguage}
            defaultTargetLanguage={defaultTargetLanguage}
          />
        )}
        {currentView === "suggest" && (
          <SuggestWords
            onWordsAdded={handleWordsAdded}
            defaultSourceLanguage={defaultSourceLanguage}
            defaultTargetLanguage={defaultTargetLanguage}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Leer woordjes met AI-vertalingen
        </div>
      </footer>
    </div>
  );
};

export default Index;
