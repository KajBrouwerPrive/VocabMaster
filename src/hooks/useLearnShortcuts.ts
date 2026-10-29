import { useEffect, useRef } from "react";
import { getLearnShortcutAction, type LearnShortcutAction } from "@/lib/learnShortcuts";

export type LearnShortcutHandlers = Record<LearnShortcutAction, () => void>;

// Binds Space/Enter, ArrowLeft and ArrowRight to the learn card actions while `enabled` is true.
export function useLearnShortcuts(handlers: LearnShortcutHandlers, enabled: boolean) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = getLearnShortcutAction(event);
      if (!action) return;
      event.preventDefault();
      handlersRef.current[action]();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
