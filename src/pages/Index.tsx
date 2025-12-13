import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { LearnMode } from "@/components/LearnMode";
import { QuizMode } from "@/components/QuizMode";
import { AddWordForm } from "@/components/AddWordForm";
import { SuggestWords } from "@/components/SuggestWords";
import { ImportWords } from "@/components/ImportWords";
import { Statistics } from "@/components/Statistics";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Languages, LogOut, Shield } from "lucide-react";

type View = "learn" | "quiz" | "add" | "suggest" | "import" | "stats";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>("learn");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [defaultSourceLanguage] = useState("nl");
  const [defaultTargetLanguage] = useState("en");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleWordsAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Languages className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">VocabMaster</h1>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                  <Shield className="h-3 w-3" />
                  Admin
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation currentView={currentView} onViewChange={setCurrentView} isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {currentView === "learn" && <LearnMode refreshTrigger={refreshTrigger} />}
        {currentView === "quiz" && <QuizMode />}
        {currentView === "stats" && <Statistics />}
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
        {currentView === "import" && (
          <ImportWords onWordsAdded={handleWordsAdded} />
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
