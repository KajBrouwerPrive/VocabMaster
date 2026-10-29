import {
  Book,
  GraduationCap,
  Plus,
  PlusCircle,
  Brain,
  FileSpreadsheet,
  BarChart3,
  GitBranch,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  NAV_SECTIONS,
  getSectionForView,
  getTargetViewForSection,
  getVisibleItems,
  type NavSectionId,
  type View,
} from "@/lib/navigation";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
}

const SECTION_ICONS: Record<NavSectionId, LucideIcon> = {
  learn: Book,
  quiz: GraduationCap,
  stats: BarChart3,
  add: PlusCircle,
};

const VIEW_ICONS: Record<View, LucideIcon> = {
  learn: Book,
  conjugations: GitBranch,
  quiz: GraduationCap,
  "quiz-conjugations": GraduationCap,
  stats: BarChart3,
  add: Plus,
  "add-conjugation": Plus,
  "request-conjugation": Send,
  admin: Settings,
  suggest: Brain,
  "import-words": FileSpreadsheet,
  "import-conjugations": FileSpreadsheet,
};

function useNavLabels() {
  const { t } = useLanguage();
  const sectionLabels: Record<NavSectionId, string> = {
    learn: t.nav_learn,
    quiz: t.nav_quiz,
    stats: t.nav_statistics,
    add: t.nav_add,
  };
  const viewLabels: Record<View, string> = {
    learn: t.nav_learn_words,
    conjugations: t.nav_learn_conjugations,
    quiz: t.nav_quiz_words,
    "quiz-conjugations": t.nav_quiz_conjugations,
    stats: t.nav_statistics,
    add: t.nav_add_word,
    "add-conjugation": t.nav_add_conjugation,
    "request-conjugation": t.nav_request_conjugation,
    admin: t.nav_admin,
    suggest: t.nav_suggest_words,
    "import-words": t.nav_import_words,
    "import-conjugations": t.nav_import_conjugations,
  };
  return { sectionLabels, viewLabels, mainLabel: t.nav_main };
}

/** Section tabs in the header, shown from the lg breakpoint up. */
export function SectionTabs({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const { sectionLabels, mainLabel } = useNavLabels();
  const activeSection = getSectionForView(currentView).id;

  return (
    <nav aria-label={mainLabel} className="hidden lg:flex self-stretch gap-1">
      {NAV_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        const isActive = section.id === activeSection;
        return (
          <button
            key={section.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onViewChange(getTargetViewForSection(section.id, currentView, isAdmin))}
            className={cn(
              "flex items-center gap-2 px-4 text-[15px] border-b-2 transition-colors focus-visible:outline-none focus-visible:bg-secondary",
              isActive
                ? "border-primary text-accent-foreground font-semibold"
                : "border-transparent text-muted-foreground font-medium hover:text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {sectionLabels[section.id]}
          </button>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar for phones, hidden from the lg breakpoint up. */
export function BottomTabBar({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const { sectionLabels, mainLabel } = useNavLabels();
  const activeSection = getSectionForView(currentView).id;

  return (
    <nav
      aria-label={mainLabel}
      className="lg:hidden fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-card/95 backdrop-blur-sm px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {NAV_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        const isActive = section.id === activeSection;
        return (
          <button
            key={section.id}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onViewChange(getTargetViewForSection(section.id, currentView, isAdmin))}
            className={cn(
              "flex h-[52px] flex-col items-center justify-center gap-1 rounded-lg text-xs transition-colors",
              isActive ? "text-accent-foreground font-semibold" : "text-muted-foreground font-medium",
            )}
          >
            <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
            {sectionLabels[section.id]}
          </button>
        );
      })}
    </nav>
  );
}

/** Segmented switcher between the views of the active section; hidden when the section has one view. */
export function SubViewSwitcher({ currentView, onViewChange, isAdmin }: NavigationProps) {
  const { sectionLabels, viewLabels } = useNavLabels();
  const section = getSectionForView(currentView);
  const items = getVisibleItems(section.items, isAdmin);
  if (items.length < 2) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div
        role="group"
        aria-label={sectionLabels[section.id]}
        className="inline-flex gap-1 rounded-xl bg-secondary p-1"
      >
        {items.map((item) => {
          const Icon = VIEW_ICONS[item.id];
          const isActive = item.id === currentView;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex h-9 items-center gap-2 whitespace-nowrap rounded-[10px] px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-card text-foreground font-semibold shadow-soft"
                  : "text-muted-foreground font-medium hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {viewLabels[item.id]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
