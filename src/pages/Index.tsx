import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { LearnMode } from "@/components/LearnMode";
import { QuizMode } from "@/components/QuizMode";
import { ConjugationQuizMode } from "@/components/ConjugationQuizMode";
import { AddWordForm } from "@/components/AddWordForm";
import { SuggestWords } from "@/components/SuggestWords";
import { ImportWords } from "@/components/ImportWords";
import { ImportConjugations } from "@/components/ImportConjugations";
import { Statistics } from "@/components/Statistics";
import { ConjugationLearnMode } from "@/components/ConjugationLearnMode";
import { AddConjugationForm } from "@/components/AddConjugationForm";
import { RequestConjugationForm } from "@/components/RequestConjugationForm";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AppLanguageSwitcher } from "@/components/AppLanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Languages, LogOut, Shield } from "lucide-react";

type View = "learn" | "quiz" | "quiz-conjugations" | "add" | "suggest" | "import-words" | "import-conjugations" | "stats" | "conjugations" | "add-conjugation" | "request-conjugation" | "admin";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>("learn");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conjugationRefreshTrigger, setConjugationRefreshTrigger] = useState(0);
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

  const handleConjugationsAdded = () => {
    setConjugationRefreshTrigger((prev) => prev + 1);
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
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Languages className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">VocabMaster</h1>
            </div>
            <div className="flex items-center gap-3">
              <AppLanguageSwitcher />
              {isAdmin && (
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                  <Shield className="h-3 w-3" />
                  Admin
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t.common_logout}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation currentView={currentView} onViewChange={setCurrentView} isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="w-full px-4 py-6">
        {currentView === "learn" && <LearnMode refreshTrigger={refreshTrigger} />}
        {currentView === "conjugations" && <ConjugationLearnMode refreshTrigger={conjugationRefreshTrigger} />}
        {currentView === "quiz" && <QuizMode />}
        {currentView === "quiz-conjugations" && <ConjugationQuizMode />}
        {currentView === "stats" && <Statistics />}
        {currentView === "add" && (
          <AddWordForm
            onWordAdded={handleWordsAdded}
            defaultSourceLanguage={defaultSourceLanguage}
            defaultTargetLanguage={defaultTargetLanguage}
          />
        )}
        {currentView === "add-conjugation" && (
          <AddConjugationForm onConjugationAdded={handleConjugationsAdded} />
        )}
        {currentView === "request-conjugation" && <RequestConjugationForm />}
        {currentView === "admin" && <AdminDashboard />}
        {currentView === "suggest" && (
          <SuggestWords
            onWordsAdded={handleWordsAdded}
            defaultSourceLanguage={defaultSourceLanguage}
            defaultTargetLanguage={defaultTargetLanguage}
          />
        )}
        {currentView === "import-words" && <ImportWords onWordsAdded={handleWordsAdded} />}
        {currentView === "import-conjugations" && <ImportConjugations onConjugationsAdded={handleConjugationsAdded} />}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-4">
        <div className="w-full px-4 text-center text-sm text-muted-foreground">VocabMaster</div>
      </footer>
    </div>
  );
};

export default Index;
