// Fast local check for agents: compares against the fork point of origin/main, runs only the steps
// that apply to the changed files (in parallel), prints one line on success and only the failing
// steps' output on failure. CI stays the authority; this never builds, installs or runs every test
// unless the test setup itself changed.
//
// Parts of the repo:
//   app       src/ and the root config (Vite, TypeScript, Tailwind, ESLint, manifest)
//   scripts   scripts/ (this check and the install hook), tested with Vitest
//   functions supabase/functions/ (Deno edge functions): lint only, there is no Deno locally
//   other     everything else (supabase/migrations, docs, workflows): no local check applies
//
// The pure logic is exported and unit-tested in scripts/__tests__/check.test.mjs.
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE_BRANCH_FALLBACKS = ["origin/main", "origin/master"];
const MAX_FAILURE_LINES = 80;
// Above this many files, pass no file list (the Windows command line has a length limit).
const MAX_FILE_ARGUMENTS = 100;
const ANSI_PATTERN = /\u001b\[[0-9;]*[A-Za-z]/g;
// Advisory lines some tools print on every run.
const NOISE_LINE_PREFIXES = ["Browserslist: caniuse-lite is outdated"];
const CACHE_DIR = "node_modules/.cache/check";

export const PART_NAMES = Object.freeze({ app: "app", scripts: "scripts", functions: "functions", other: "other" });

const LINTABLE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
// Changing these can change the lint verdict of any file. Only the ESLint config triggers a full
// lint: `eslint .` still reports errors that predate this check, so a manifest or lockfile change
// would otherwise fail on files nobody touched.
const FULL_LINT_TRIGGERS = new Set(["eslint.config.js"]);
// Changing these can change the outcome of any test, so the whole (small) suite runs.
const FULL_TEST_TRIGGERS = new Set(["vitest.config.ts", "package.json", "package-lock.json", "tsconfig.json", "tsconfig.node.json"]);
// The app type check covers src/ under tsconfig.app.json; these root files change its result.
const APP_TYPECHECK_TRIGGERS = new Set(["tsconfig.json", "tsconfig.app.json", "package.json", "package-lock.json"]);
// Root files type-checked by tsconfig.node.json.
const NODE_TYPECHECK_TRIGGERS = new Set(["vite.config.ts", "vitest.config.ts", "tsconfig.node.json", "package.json", "package-lock.json"]);
const APP_ROOT_FILES = new Set([
  "index.html",
  "components.json",
  "eslint.config.js",
  "postcss.config.js",
  "tailwind.config.ts",
  "vite.config.ts",
  "vitest.config.ts",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "package.json",
  "package-lock.json",
]);

const node = (script) => ({ command: process.execPath, prefixArgs: [script] });
const ESLINT = node("node_modules/eslint/bin/eslint.js");
const TSC = node("node_modules/typescript/bin/tsc");
const VITEST = node("node_modules/vitest/vitest.mjs");

/**
 * @param {string} file repo-relative path with forward slashes
 * @returns {string} the part of the repo the file belongs to
 */
export function partOf(file) {
  if (file.startsWith("src/") || file.startsWith("public/") || APP_ROOT_FILES.has(file)) return PART_NAMES.app;
  if (file.startsWith("scripts/")) return PART_NAMES.scripts;
  if (file.startsWith("supabase/functions/")) return PART_NAMES.functions;
  return PART_NAMES.other;
}

/**
 * @param {string[]} changedFiles
 * @returns {{ all: boolean, files: string[] } | null} what to lint, or null when nothing applies
 */
export function lintTargets(changedFiles) {
  if (changedFiles.some((file) => FULL_LINT_TRIGGERS.has(file))) return { all: true, files: [] };
  const files = changedFiles.filter((file) => LINTABLE_FILE.test(file) && partOf(file) !== PART_NAMES.other);
  if (files.length === 0) return null;
  if (files.length > MAX_FILE_ARGUMENTS) return { all: true, files: [] };
  return { all: false, files };
}

/**
 * @param {string[]} changedFiles
 * @returns {{ all: boolean, files: string[] } | null} which tests to run, or null when none apply
 */
export function testTargets(changedFiles) {
  if (changedFiles.some((file) => FULL_TEST_TRIGGERS.has(file))) return { all: true, files: [] };
  const files = changedFiles.filter((file) => /\.(ts|tsx|mjs)$/.test(file) && (file.startsWith("src/") || file.startsWith("scripts/")));
  if (files.length === 0) return null;
  if (files.length > MAX_FILE_ARGUMENTS) return { all: true, files: [] };
  return { all: false, files };
}

/** @param {string} output vitest output without colour codes */
export function summarizeTests(output) {
  const match = output.match(/Tests\s+(\d+) passed/);
  if (match) return `${match[1]} tests`;
  return /No test files found/.test(output) ? "no related tests" : "";
}

/** @param {string[]} files @param {boolean} all */
function fileCount(files, all) {
  return all ? "all files" : `${files.length} file${files.length === 1 ? "" : "s"}`;
}

/**
 * @typedef {{ name: string, command: string, args: string[], summarize?: (output: string) => string }} Step
 * Decide which steps run for the changed files.
 * @param {string[]} changedFiles repo-relative paths with forward slashes
 * @returns {{ steps: Step[], skippedParts: string[] }}
 */
export function selectSteps(changedFiles) {
  const steps = [];
  const lint = lintTargets(changedFiles);
  if (lint) {
    steps.push({
      name: "lint",
      command: ESLINT.command,
      args: [...ESLINT.prefixArgs, "--cache", "--cache-location", `${CACHE_DIR}/eslint`, "--no-warn-ignored", ...(lint.all ? ["."] : lint.files)],
      summarize: () => fileCount(lint.files, lint.all),
    });
  }
  const typecheckApp = changedFiles.some(
    (file) => APP_TYPECHECK_TRIGGERS.has(file) || (file.startsWith("src/") && /\.(ts|tsx)$/.test(file)),
  );
  if (typecheckApp) {
    steps.push({
      name: "typecheck",
      command: TSC.command,
      args: [...TSC.prefixArgs, "-p", "tsconfig.app.json", "--noEmit", "--incremental", "--tsBuildInfoFile", `${CACHE_DIR}/tsconfig.app.tsbuildinfo`],
    });
  }
  if (changedFiles.some((file) => NODE_TYPECHECK_TRIGGERS.has(file))) {
    steps.push({
      name: "typecheck-config",
      command: TSC.command,
      args: [...TSC.prefixArgs, "-p", "tsconfig.node.json", "--noEmit", "--incremental", "--tsBuildInfoFile", `${CACHE_DIR}/tsconfig.node.tsbuildinfo`],
    });
  }
  const tests = testTargets(changedFiles);
  if (tests) {
    steps.push({
      name: "tests",
      command: VITEST.command,
      args: [...VITEST.prefixArgs, ...(tests.all ? ["run"] : ["related", "--run", ...tests.files]), "--passWithNoTests"],
      summarize: summarizeTests,
    });
  }
  const changedParts = new Set(changedFiles.map(partOf));
  const skippedParts = [PART_NAMES.app, PART_NAMES.scripts, PART_NAMES.functions].filter((part) => !changedParts.has(part));
  return { steps, skippedParts };
}

/** @param {string} text */
export function stripAnsi(text) {
  return text.replace(ANSI_PATTERN, "");
}

/**
 * @param {string} output a failing step's combined stdout and stderr
 * @returns {string} the output without noise, capped so a flood of errors stays readable
 */
export function trimFailureOutput(output) {
  const lines = stripAnsi(output)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !NOISE_LINE_PREFIXES.some((prefix) => line.startsWith(prefix)));
  while (lines.length > 0 && lines[0] === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  if (lines.length <= MAX_FAILURE_LINES) return lines.join("\n");
  const hidden = lines.length - MAX_FAILURE_LINES;
  return `${lines.slice(0, MAX_FAILURE_LINES).join("\n")}\n... ${hidden} more lines (run the step on its own for the full output)`;
}

/**
 * @typedef {{ name: string, ok: boolean, detail: string, output: string }} StepResult
 * @param {StepResult[]} results
 * @param {number} elapsedMs
 * @param {string[]} [skippedParts] parts without changes, named so nobody thinks they ran
 * @returns {{ exitCode: 0 | 1, text: string }}
 */
export function formatReport(results, elapsedMs, skippedParts = []) {
  const seconds = (elapsedMs / 1000).toFixed(1);
  const skipped = skippedParts.length > 0 ? `; ${skippedParts.join(", ")} unchanged, skipped` : "";
  const failed = results.filter((result) => !result.ok);
  if (failed.length === 0) {
    const parts = results.map((result) => (result.detail ? `${result.name} ${result.detail}` : result.name));
    return { exitCode: 0, text: `check ok: ${parts.join(", ")} (${seconds}s${skipped})` };
  }
  const sections = failed.map((result) => `--- ${result.name} failed ---\n${trimFailureOutput(result.output)}`);
  return {
    exitCode: 1,
    text: `${sections.join("\n\n")}\n\ncheck FAILED: ${failed.map((result) => result.name).join(", ")} (${seconds}s${skipped})`,
  };
}

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || result.error?.message || "").trim()}`);
  }
  return result.stdout.trim();
}

function resolveBaseRef(root) {
  const head = spawnSync("git", ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], { cwd: root, encoding: "utf8" });
  const candidates = head.status === 0 ? [head.stdout.trim(), ...BASE_BRANCH_FALLBACKS] : BASE_BRANCH_FALLBACKS;
  const found = candidates.find((ref) => spawnSync("git", ["rev-parse", "--verify", "--quiet", ref], { cwd: root }).status === 0);
  if (!found) throw new Error("cannot find the base branch on origin; run `git fetch origin main` first");
  return found;
}

/**
 * Files changed relative to the point this branch left the base branch, including
 * uncommitted and untracked work, minus deletions.
 */
function resolveChanges(root) {
  const baseRef = resolveBaseRef(root);
  const mergeBase = git(root, ["merge-base", baseRef, "HEAD"]);
  const lines = (text) => text.split("\n").filter(Boolean);
  const tracked = lines(git(root, ["diff", "--name-only", "--diff-filter=ACMR", mergeBase]));
  const untracked = lines(git(root, ["ls-files", "--others", "--exclude-standard"]));
  return { baseRef, mergeBase, files: [...new Set([...tracked, ...untracked])] };
}

/** @param {string} root @param {Step} step @returns {Promise<StepResult>} */
function runStep(root, step) {
  return new Promise((resolve) => {
    const child = spawn(step.command, step.args, {
      cwd: root,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", (error) => resolve({ name: step.name, ok: false, detail: "", output: String(error) }));
    child.on("close", (code) => {
      const ok = code === 0;
      resolve({ name: step.name, ok, detail: ok ? (step.summarize?.(stripAnsi(output)) ?? "") : "", output });
    });
  });
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const startedAt = Date.now();
  const { baseRef, mergeBase, files } = resolveChanges(root);
  const seconds = () => ((Date.now() - startedAt) / 1000).toFixed(1);

  if (files.length === 0) {
    console.log(`check ok: nothing changed vs ${baseRef} (${mergeBase.slice(0, 7)}, ${seconds()}s)`);
    return;
  }

  const { steps, skippedParts } = selectSteps(files);
  if (steps.length === 0) {
    console.log(`check ok: no checks apply to the ${files.length} changed file(s) (${seconds()}s)`);
    return;
  }

  const report = formatReport(await Promise.all(steps.map((step) => runStep(root, step))), Date.now() - startedAt, skippedParts);
  console.log(report.text);
  process.exitCode = report.exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`check FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
