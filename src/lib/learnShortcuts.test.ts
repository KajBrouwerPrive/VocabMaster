import { describe, expect, it } from "vitest";
import { getLearnShortcutAction } from "./learnShortcuts";

// Minimal stand-in for a DOM element: `closest` matches when the selector names this element's tag or role.
function fakeElement(tag: string, role?: string): EventTarget {
  return {
    closest: (selector: string) => {
      const parts = selector.split(",").map((part) => part.trim());
      const matchesTag = parts.some((part) => part === tag || part.startsWith(`${tag}[`) || part.startsWith(`${tag}:`));
      const matchesRole = role !== undefined && parts.includes(`[role="${role}"]`);
      return matchesTag || matchesRole ? {} : null;
    },
  } as unknown as EventTarget;
}

const body = fakeElement("body");

describe("getLearnShortcutAction", () => {
  it("maps Space and Enter to the primary card action", () => {
    expect(getLearnShortcutAction({ key: " ", target: body })).toBe("primary");
    expect(getLearnShortcutAction({ key: "Enter", target: body })).toBe("primary");
  });

  it("maps the arrow keys to browsing", () => {
    expect(getLearnShortcutAction({ key: "ArrowRight", target: body })).toBe("next");
    expect(getLearnShortcutAction({ key: "ArrowLeft", target: body })).toBe("previous");
  });

  it("ignores other keys and modifier combinations", () => {
    expect(getLearnShortcutAction({ key: "a", target: body })).toBeNull();
    expect(getLearnShortcutAction({ key: "ArrowRight", target: body, ctrlKey: true })).toBeNull();
    expect(getLearnShortcutAction({ key: "Enter", target: body, defaultPrevented: true })).toBeNull();
  });

  it("leaves every key to text fields and open dialogs", () => {
    expect(getLearnShortcutAction({ key: " ", target: fakeElement("input") })).toBeNull();
    expect(getLearnShortcutAction({ key: "ArrowLeft", target: fakeElement("textarea") })).toBeNull();
    expect(getLearnShortcutAction({ key: "Enter", target: fakeElement("div", "alertdialog") })).toBeNull();
  });

  it("lets focused buttons handle Space and Enter themselves but still browses with arrows", () => {
    const button = fakeElement("button");
    expect(getLearnShortcutAction({ key: " ", target: button })).toBeNull();
    expect(getLearnShortcutAction({ key: "Enter", target: button })).toBeNull();
    expect(getLearnShortcutAction({ key: "ArrowRight", target: button })).toBe("next");
  });

  it("handles a missing target", () => {
    expect(getLearnShortcutAction({ key: "Enter", target: null })).toBe("primary");
  });
});
