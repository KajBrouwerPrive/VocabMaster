import { formatReport, lintTargets, partOf, selectSteps, stripAnsi, summarizeTests, testTargets, trimFailureOutput } from "../check.mjs";

const stepNames = (files) => selectSteps(files).steps.map((step) => step.name);

describe("partOf", () => {
  it.each([
    ["src/lib/api.ts", "app"],
    ["src/components/QuizMode.tsx", "app"],
    ["public/robots.txt", "app"],
    ["vite.config.ts", "app"],
    ["package-lock.json", "app"],
    ["scripts/check.mjs", "scripts"],
    ["supabase/functions/translate-word/index.ts", "functions"],
    ["supabase/migrations/20260101110229_x.sql", "other"],
    ["CLAUDE.md", "other"],
    [".github/workflows/ci.yml", "other"],
  ])("puts %s in %s", (file, part) => {
    expect(partOf(file)).toBe(part);
  });
});

describe("lintTargets", () => {
  it("lints only changed code files", () => {
    expect(lintTargets(["src/lib/api.ts", "CLAUDE.md", "src/index.css"])).toEqual({ all: false, files: ["src/lib/api.ts"] });
  });

  it("lints edge functions and scripts too", () => {
    expect(lintTargets(["supabase/functions/suggest-words/index.ts", "scripts/check.mjs"]).files).toHaveLength(2);
  });

  it("lints everything when the ESLint config changed", () => {
    expect(lintTargets(["eslint.config.js", "src/lib/api.ts"])).toEqual({ all: true, files: [] });
  });

  it("does not lint everything for a manifest change", () => {
    expect(lintTargets(["package.json"])).toBeNull();
  });

  it("falls back to everything for a very long file list", () => {
    const files = Array.from({ length: 101 }, (_, index) => `src/file${index}.ts`);
    expect(lintTargets(files)).toEqual({ all: true, files: [] });
  });

  it("returns null when no code changed", () => {
    expect(lintTargets(["supabase/migrations/1.sql", "README.md"])).toBeNull();
  });
});

describe("testTargets", () => {
  it("passes changed source and script files to vitest related", () => {
    expect(testTargets(["src/lib/utils.ts", "scripts/check.mjs", "README.md"])).toEqual({ all: false, files: ["src/lib/utils.ts", "scripts/check.mjs"] });
  });

  it.each(["vitest.config.ts", "package.json", "package-lock.json"])("runs every test when %s changed", (file) => {
    expect(testTargets([file, "src/lib/utils.ts"])).toEqual({ all: true, files: [] });
  });

  it("skips tests for edge functions, which have none", () => {
    expect(testTargets(["supabase/functions/translate-word/index.ts"])).toBeNull();
  });
});

describe("selectSteps", () => {
  it("runs lint, typecheck and related tests for a source change", () => {
    expect(stepNames(["src/lib/utils.ts"])).toEqual(["lint", "typecheck", "tests"]);
  });

  it("skips the type check for a CSS-only change", () => {
    expect(stepNames(["src/index.css"])).toEqual([]);
  });

  it("type-checks the config project when the Vite config changed", () => {
    expect(stepNames(["vite.config.ts"])).toEqual(["lint", "typecheck-config"]);
  });

  it("only lints an edge function change", () => {
    expect(stepNames(["supabase/functions/translate-word/index.ts"])).toEqual(["lint"]);
  });

  it("runs lint and tests for a script change", () => {
    expect(stepNames(["scripts/guard-install.mjs"])).toEqual(["lint", "tests"]);
  });

  it("runs nothing for a migration", () => {
    expect(stepNames(["supabase/migrations/1.sql"])).toEqual([]);
  });

  it("names the parts without changes", () => {
    expect(selectSteps(["src/lib/utils.ts"]).skippedParts).toEqual(["scripts", "functions"]);
  });

  it("passes the changed files to vitest related", () => {
    const tests = selectSteps(["src/lib/utils.ts"]).steps.find((step) => step.name === "tests");
    expect(tests.args).toEqual(expect.arrayContaining(["related", "--run", "src/lib/utils.ts", "--passWithNoTests"]));
  });
});

describe("summarizeTests", () => {
  it("reports the passed test count", () => {
    expect(summarizeTests(" Test Files  2 passed (2)\n      Tests  41 passed (41)")).toBe("41 tests");
  });

  it("says when no related tests exist", () => {
    expect(summarizeTests("No test files found, exiting with code 0")).toBe("no related tests");
  });
});

describe("stripAnsi", () => {
  it("removes colour codes", () => {
    expect(stripAnsi("\u001b[31merror\u001b[39m")).toBe("error");
  });
});

describe("trimFailureOutput", () => {
  it("drops noise and blank edges", () => {
    expect(trimFailureOutput("\nBrowserslist: caniuse-lite is outdated\nreal error\n\n")).toBe("real error");
  });

  it("caps long output", () => {
    const output = Array.from({ length: 100 }, (_, index) => `line ${index}`).join("\n");
    const trimmed = trimFailureOutput(output).split("\n");
    expect(trimmed).toHaveLength(81);
    expect(trimmed.at(-1)).toMatch(/^\.\.\. 20 more lines/);
  });
});

describe("formatReport", () => {
  it("prints one line on success, with skipped parts", () => {
    const report = formatReport([{ name: "lint", ok: true, detail: "2 files", output: "" }, { name: "typecheck", ok: true, detail: "", output: "" }], 1234, ["functions"]);
    expect(report).toEqual({ exitCode: 0, text: "check ok: lint 2 files, typecheck (1.2s; functions unchanged, skipped)" });
  });

  it("prints only the failing steps on failure", () => {
    const report = formatReport([{ name: "lint", ok: true, detail: "", output: "fine" }, { name: "typecheck", ok: false, detail: "", output: "src/a.ts(1,1): error TS2322" }], 2000);
    expect(report.exitCode).toBe(1);
    expect(report.text).toBe("--- typecheck failed ---\nsrc/a.ts(1,1): error TS2322\n\ncheck FAILED: typecheck (2.0s)");
  });
});
