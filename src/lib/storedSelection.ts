// Small persisted UI preferences. Storage can be missing or throw (private mode, blocked site data),
// so every access is guarded and callers fall back to their defaults.

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Reads a stored list, keeping only allowed, unique values; returns null when nothing usable is stored. */
export function readStoredList<T extends string>(
  key: string,
  allowed: readonly T[],
  maxLength: number,
  storage: StorageLike | null = getBrowserStorage(),
): T[] | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const allowedSet = new Set<string>(allowed);
    const values = [...new Set(parsed.filter((value): value is T => typeof value === "string" && allowedSet.has(value)))];
    return values.length > 0 ? values.slice(0, maxLength) : null;
  } catch (error) {
    console.warn(`Ignoring unreadable stored value for "${key}":`, error);
    return null;
  }
}

export function writeStoredList(key: string, values: readonly string[], storage: StorageLike | null = getBrowserStorage()) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(values));
  } catch (error) {
    console.warn(`Could not store value for "${key}":`, error);
  }
}
