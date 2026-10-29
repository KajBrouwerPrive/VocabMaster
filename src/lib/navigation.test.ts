import { describe, expect, it } from "vitest";
import {
  NAV_SECTIONS,
  getInitials,
  getSectionForView,
  getTargetViewForSection,
  getVisibleItems,
  type View,
} from "./navigation";

const ALL_VIEWS: View[] = [
  "learn",
  "quiz",
  "quiz-conjugations",
  "add",
  "suggest",
  "import-words",
  "import-conjugations",
  "stats",
  "conjugations",
  "add-conjugation",
  "request-conjugation",
  "admin",
];

describe("navigation sections", () => {
  it("places every view in exactly one section", () => {
    const placed = NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.id));
    expect([...placed].sort()).toEqual([...ALL_VIEWS].sort());
  });

  it("finds the section of a view", () => {
    expect(getSectionForView("conjugations").id).toBe("learn");
    expect(getSectionForView("quiz-conjugations").id).toBe("quiz");
    expect(getSectionForView("import-words").id).toBe("add");
  });

  it("hides admin-only views from users and user-only views from admins", () => {
    const addItems = getSectionForView("add").items;
    expect(getVisibleItems(addItems, false).map((item) => item.id)).toEqual(["add", "request-conjugation"]);
    expect(getVisibleItems(addItems, true).map((item) => item.id)).not.toContain("request-conjugation");
    expect(getVisibleItems(addItems, true).map((item) => item.id)).toContain("import-conjugations");
  });
});

describe("getTargetViewForSection", () => {
  it("keeps the current view when it belongs to the section", () => {
    expect(getTargetViewForSection("learn", "conjugations", false)).toBe("conjugations");
  });

  it("opens the first visible view of another section", () => {
    expect(getTargetViewForSection("quiz", "conjugations", false)).toBe("quiz");
    expect(getTargetViewForSection("stats", "learn", true)).toBe("stats");
  });

  it("does not open an admin view for a user", () => {
    expect(getTargetViewForSection("add", "admin", false)).toBe("add");
  });
});

describe("getInitials", () => {
  it("uses the first two characters of the e-mail name", () => {
    expect(getInitials("kaj.bruin@example.com")).toBe("KA");
  });

  it("falls back to a placeholder without a usable e-mail", () => {
    expect(getInitials(undefined)).toBe("?");
    expect(getInitials("@example.com")).toBe("?");
  });
});
