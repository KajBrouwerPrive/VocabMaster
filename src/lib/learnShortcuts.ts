export type LearnShortcutAction = "primary" | "next" | "previous";

export interface ShortcutEventLike {
  key: string;
  target: EventTarget | null;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
}

// Text entry and open overlays own every key.
const TEXT_ENTRY_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';
// Controls that activate natively on Space/Enter; handling those keys too would trigger twice.
const ACTIVATABLE_SELECTOR = 'button, a[href], [role="button"], [role="switch"], [role="checkbox"], [role="tab"]';

const KEY_ACTIONS: Record<string, LearnShortcutAction> = {
  " ": "primary",
  Enter: "primary",
  ArrowRight: "next",
  ArrowLeft: "previous",
};

function matches(target: EventTarget | null, selector: string): boolean {
  const element = target as Element | null;
  return typeof element?.closest === "function" && element.closest(selector) !== null;
}

export function getLearnShortcutAction(event: ShortcutEventLike): LearnShortcutAction | null {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return null;
  const action = KEY_ACTIONS[event.key];
  if (!action) return null;
  if (matches(event.target, TEXT_ENTRY_SELECTOR)) return null;
  if (action === "primary" && matches(event.target, ACTIVATABLE_SELECTOR)) return null;
  return action;
}
