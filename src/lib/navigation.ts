export type View =
  | "learn"
  | "quiz"
  | "quiz-conjugations"
  | "add"
  | "suggest"
  | "import-words"
  | "import-conjugations"
  | "stats"
  | "conjugations"
  | "add-conjugation"
  | "request-conjugation"
  | "admin";

export type NavSectionId = "learn" | "quiz" | "stats" | "add";

export interface NavItem {
  id: View;
  adminOnly?: boolean;
  userOnly?: boolean;
}

export interface NavSection {
  id: NavSectionId;
  items: NavItem[];
}

// Top-level sections in display order; each holds the views reachable from its sub switcher.
export const NAV_SECTIONS: NavSection[] = [
  { id: "learn", items: [{ id: "learn" }, { id: "conjugations" }] },
  { id: "quiz", items: [{ id: "quiz" }, { id: "quiz-conjugations" }] },
  { id: "stats", items: [{ id: "stats" }] },
  {
    id: "add",
    items: [
      { id: "add" },
      { id: "add-conjugation", adminOnly: true },
      { id: "request-conjugation", userOnly: true },
      { id: "admin", adminOnly: true },
      { id: "suggest", adminOnly: true },
      { id: "import-words", adminOnly: true },
      { id: "import-conjugations", adminOnly: true },
    ],
  },
];

export function getVisibleItems(items: NavItem[], isAdmin: boolean): NavItem[] {
  return items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.userOnly && isAdmin) return false;
    return true;
  });
}

export function getSectionForView(view: View): NavSection {
  const section = NAV_SECTIONS.find((candidate) => candidate.items.some((item) => item.id === view));
  if (!section) {
    throw new Error(`View "${view}" does not belong to a navigation section`);
  }
  return section;
}

// Opening a section keeps the current view when it already belongs there, otherwise picks the first visible one.
export function getTargetViewForSection(sectionId: NavSectionId, currentView: View, isAdmin: boolean): View {
  const section = NAV_SECTIONS.find((candidate) => candidate.id === sectionId);
  if (!section) {
    throw new Error(`Unknown navigation section "${sectionId}"`);
  }
  const visible = getVisibleItems(section.items, isAdmin);
  if (visible.some((item) => item.id === currentView)) return currentView;
  if (visible.length === 0) {
    throw new Error(`Navigation section "${sectionId}" has no visible views`);
  }
  return visible[0].id;
}

export function getInitials(email: string | null | undefined): string {
  const name = (email ?? "").split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  return name.slice(0, 2).toUpperCase() || "?";
}
