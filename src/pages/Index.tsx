import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SectionTabs, BottomTabBar, SubViewSwitcher } from "@/components/Navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { getInitials, type View } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Languages, LogOut, Shield } from "lucide-react";

// Views whose content needs more width than a single card column.
const WIDE_VIEWS: ReadonlySet<View> = new Set<View>(["conjugations"]);

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

  const navigationProps = { currentView, onViewChange: setCurrentView, isAdmin };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
              <Languages className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">VocabMaster</h1>
          </div>
          <SectionTabs {...navigationProps} />
          <div className="flex items-center gap-2">
            <AppLanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t.nav_account_menu}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {getInitials(user.email)}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate text-sm">{user.email}</span>
                  {isAdmin && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      <Shield className="h-3 w-3" aria-hidden="true" />
                      Admin
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t.common_logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "mx-auto space-y-5 px-4 pt-6 pb-28 lg:pb-12",
          WIDE_VIEWS.has(currentView) ? "max-w-5xl" : "max-w-2xl",
        )}
      >
        <SubViewSwitcher {...navigationProps} />
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

      <BottomTabBar {...navigationProps} />
    </div>
  );
};

export default Index;
