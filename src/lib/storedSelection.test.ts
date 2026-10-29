import { describe, expect, it, vi } from "vitest";
import { readStoredList, writeStoredList } from "./storedSelection";

const ALLOWED = ["present", "past", "perfect"] as const;

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("readStoredList", () => {
  it("returns null when nothing is stored or storage is unavailable", () => {
    expect(readStoredList("key", ALLOWED, 3, memoryStorage())).toBeNull();
    expect(readStoredList("key", ALLOWED, 3, null)).toBeNull();
  });

  it("keeps allowed, unique values within the maximum", () => {
    const storage = memoryStorage({ key: JSON.stringify(["past", "unknown", "past", "present", "perfect"]) });
    expect(readStoredList("key", ALLOWED, 2, storage)).toEqual(["past", "present"]);
  });

  it("ignores malformed or empty values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(readStoredList("key", ALLOWED, 3, memoryStorage({ key: "{not json" }))).toBeNull();
    expect(readStoredList("key", ALLOWED, 3, memoryStorage({ key: JSON.stringify({ present: true }) }))).toBeNull();
    expect(readStoredList("key", ALLOWED, 3, memoryStorage({ key: JSON.stringify(["unknown"]) }))).toBeNull();
    warn.mockRestore();
  });
});

describe("writeStoredList", () => {
  it("round-trips through readStoredList", () => {
    const storage = memoryStorage();
    writeStoredList("key", ["perfect", "present"], storage);
    expect(readStoredList("key", ALLOWED, 3, storage)).toEqual(["perfect", "present"]);
  });

  it("does not throw when storage refuses the write", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => writeStoredList("key", ["present"], storage)).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
