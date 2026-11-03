// PreToolUse hook for Claude Code (Bash and PowerShell): agents may install dependencies only in
// their own worktree under .claude/worktrees/, never in the main checkout or any path outside it.
// The allow rules in .claude/settings.json let the repo's install commands run without a prompt;
// permission rules match the command text only, not the directory, so this hook adds the
// directory check. It applies to both shells, so a refusal in one cannot be bypassed in the other.
//
// It also guards the allow rule for the `agent-klaar` commit status: the `*` in that rule matches
// spaces too, so it would allow extra arguments (another state, another endpoint). Any `gh api` call
// that names `agent-klaar` is refused unless the whole command is exactly AGENT_READY_COMMAND for this
// repo and a full 40-character SHA (CNT-43).
//
// Wired in .claude/settings.json under hooks.PreToolUse. Reads the hook input JSON on stdin and
// prints a deny decision, or nothing to leave the normal permission flow in charge. The pure logic
// is exported and unit-tested in scripts/__tests__/guard-install.test.mjs.
//
// Reuse in another repo: copy this file and change ALLOWED_INSTALL_FORMS below.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const GUARDED_TOOLS = Object.freeze(["Bash", "PowerShell"]);

// Per-repo setting: the install forms an agent may use in its own worktree. They are named in the
// refusal message (joined with " or "); the matching allow rules live in .claude/settings.json.
export const ALLOWED_INSTALL_FORMS = Object.freeze(["npm ci"]);

// Per-repo setting: the GitHub repo the `agent-klaar` status may be set on (this repo, never another).
export const AGENT_READY_REPO = "KajBrouwerPrive/VocabMaster";
export const AGENT_READY_CONTEXT = "agent-klaar";
// The only accepted form, with <sha> standing for the full SHA from `git rev-parse HEAD`.
export const AGENT_READY_COMMAND = `gh api repos/${AGENT_READY_REPO}/statuses/<sha> -f state=success -f context=${AGENT_READY_CONTEXT} -f description="Agent done"`;
const FULL_COMMIT_SHA = "[0-9a-f]{40}";
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const AGENT_READY_PATTERN = new RegExp(`^${AGENT_READY_COMMAND.split("<sha>").map(escapeRegExp).join(FULL_COMMIT_SHA)}$`);

// npm subcommands (and their aliases) that write node_modules or the lockfile.
const NPM_INSTALL_SUBCOMMANDS = new Set(["ci", "clean-install", "install-clean", "install", "i", "in", "isntall", "add", "update", "up", "upgrade"]);
// bun subcommands that write node_modules or the lockfile. A repo may keep a bun lockfile next to the
// npm lockfile (Lovable does), so an agent may reach for bun even where npm is the install form.
// `bun pm` and `bun create` are left out: they mostly read or scaffold a new project.
const BUN_INSTALL_SUBCOMMANDS = new Set(["install", "i", "add", "a", "update", "remove", "rm", "link", "patch"]);
// bun options that take a separate value, so the value is not mistaken for the subcommand.
const BUN_OPTIONS_WITH_VALUE = new Set(["--cwd", "--config", "-c"]);
// npm options that take a separate value, so the value is not mistaken for the subcommand.
const NPM_OPTIONS_WITH_VALUE = new Set(["--prefix", "-C", "--workspace", "-w", "--cache", "--registry", "--userconfig"]);
const COMMAND_SEPARATOR = /&&|\|\||[;|&\n]/;
// Programs that run their arguments as a command line, so quoted text after them is still code.
const SHELL_WRAPPERS = ["bash", "sh", "zsh", "dash", "pwsh", "powershell", "cmd", "eval"];
const WORKTREE_SEGMENT = /\/\.claude\/worktrees\/[^/]+(\/|$)/i;
const WORKTREE_ROOT = /^.*?\/\.claude\/worktrees\/[^/]+/;
// Absolute paths that are harmless in an install command (output redirection).
const HARMLESS_ABSOLUTE_PATHS = new Set(["/dev/null"]);
// The tool whose commands may carry heredocs. PowerShell has no `<<` heredoc, so its commands are
// inspected as they are.
const HEREDOC_TOOL = "Bash";
// `<<WORD`, `<<-WORD`, `<<'WORD'` or `<<"WORD"`, ending at a word boundary. Other delimiter forms
// (`<<\WORD`, `<<E"OF"`, `<<$X`) are not recognised, so such a command is inspected as it is.
const HEREDOC_OPERATOR = /^<<-?[ \t]*(?:'([^'\n]+)'|"([^"\n]+)"|([\w.+\-:@%,]+))(?=[\s;&|<>()]|$)/;
// Syntax whose quoting the heredoc scanner does not follow (command, arithmetic and parameter
// substitution, ANSI-C quotes, arithmetic commands); a command that uses it is inspected as it is.
const UNTRACKED_SYNTAX = /^(\$\(|\$\[|\$\{|\$'|`|\(\()/;
const WORD_BOUNDARY = /[\s;&|()<>]/;
// Programs (next to SHELL_WRAPPERS) that run a file or stdin as shell code; `.` counts only as a command.
const SHELL_SOURCE_COMMANDS = ["source"];
const SOURCE_DOT = ".";

/**
 * Loose tokenizer for the path check: splits on whitespace only and strips edge quotes. Deliberately
 * conservative, so quoted text is still inspected for paths that leave the worktree.
 * @param {string} segment one simple command, without separators
 */
function tokenize(segment) {
  return segment.trim().split(/\s+/).filter(Boolean).map((token) => token.replace(/^["']|["']$/g, ""));
}

/**
 * Splits a command line into simple commands made of tokens. Text between single or double quotes
 * belongs to one token and separators inside quotes do not split. Backslashes are not escapes (they
 * are Windows path separators).
 * @param {string} command
 * @returns {{ text: string, quoted: boolean }[][]}
 */
function parseCommand(command) {
  const segments = [];
  let tokens = [];
  let text = "";
  let hasToken = false;
  let quoted = false;
  const endToken = () => {
    if (hasToken) tokens.push({ text, quoted });
    text = "";
    hasToken = false;
    quoted = false;
  };
  const endSegment = () => {
    endToken();
    if (tokens.length > 0) segments.push(tokens);
    tokens = [];
  };
  let index = 0;
  while (index < command.length) {
    const char = command[index];
    if (char === '"' || char === "'") {
      const close = command.indexOf(char, index + 1);
      const end = close === -1 ? command.length : close;
      text += command.slice(index + 1, end);
      hasToken = true;
      quoted = true;
      index = end + 1;
    } else if (char === "\n" || char === ";") {
      endSegment();
      index += 1;
    } else if (char === "&" || char === "|") {
      endSegment();
      index += command[index + 1] === char ? 2 : 1;
    } else if (/\s/.test(char)) {
      endToken();
      index += 1;
    } else {
      text += char;
      hasToken = true;
      index += 1;
    }
  }
  endSegment();
  return segments;
}

/** @param {string} token */
function isProgram(token, name) {
  const base = token.replace(/\\/g, "/").split("/").pop().toLowerCase();
  return base === name || base === `${name}.cmd` || base === `${name}.exe` || base === `${name}.ps1`;
}

/** @param {string | undefined} token */
function isShellWrapper(token) {
  return token !== undefined && SHELL_WRAPPERS.some((name) => isProgram(token, name));
}

/**
 * True when any simple command in the text starts or names a shell that could run a heredoc body,
 * even through a pipe or on another line (`cat <<EOF | bash`, `source /dev/stdin <<EOF`).
 * @param {string} command
 */
function runsShellCode(command) {
  return command.split(/[;&|\n(){}`]/).some((segment) => {
    const words = segment.split(/[\s<>'"]+/).filter(Boolean);
    return words[0] === SOURCE_DOT || words.some((word) => isShellWrapper(word) || SHELL_SOURCE_COMMANDS.some((name) => isProgram(word, name)));
  });
}

/**
 * The index just past the line that closes a heredoc, or -1 when no line closes it. The delimiter is
 * compared after trimming, so the body never ends later than in bash.
 * @param {string} command
 * @param {number} start index of the first body line
 * @param {string} delimiter
 */
function heredocEnd(command, start, delimiter) {
  let lineStart = start;
  while (lineStart < command.length) {
    const newline = command.indexOf("\n", lineStart);
    const lineEnd = newline === -1 ? command.length : newline;
    const next = newline === -1 ? command.length : newline + 1;
    if (command.slice(lineStart, lineEnd).trim() === delimiter) return next;
    lineStart = next;
  }
  return -1;
}

/**
 * Removes heredoc bodies (and their closing lines) from a bash command, because a body is data like
 * quoted text: a script for `node -`, a commit message for `git commit -F -`. The command comes back
 * unchanged whenever a body could run as shell code (a shell wrapper or `source` anywhere in the rest
 * of the command) or the scanner cannot be sure where a body starts and ends (an unclosed or
 * unrecognised heredoc, or syntax listed in UNTRACKED_SYNTAX), so it is then inspected as before.
 * @param {string} command
 */
export function stripHeredocBodies(command) {
  const bodies = [];
  const pendingDelimiters = [];
  let quote = null;
  let index = 0;
  while (index < command.length) {
    const char = command[index];
    if (quote === "'") {
      if (char === "'") quote = null;
      index += 1;
    } else if (quote === '"') {
      if (char === "\\") {
        index += 2;
        continue;
      }
      if (UNTRACKED_SYNTAX.test(command.slice(index, index + 3))) return command;
      if (char === '"') quote = null;
      index += 1;
    } else if (UNTRACKED_SYNTAX.test(command.slice(index, index + 3))) {
      return command;
    } else if (char === "\\") {
      index += 2;
    } else if (char === "'" || char === '"') {
      quote = char;
      index += 1;
    } else if (char === "#" && (index === 0 || WORD_BOUNDARY.test(command[index - 1]))) {
      const newline = command.indexOf("\n", index);
      index = newline === -1 ? command.length : newline;
    } else if (command.startsWith("<<<", index)) {
      index += 3;
    } else if (command.startsWith("<<", index)) {
      const match = command.slice(index).match(HEREDOC_OPERATOR);
      if (!match) return command;
      pendingDelimiters.push(match[1] ?? match[2] ?? match[3]);
      index += match[0].length;
    } else if (char === "\n" && pendingDelimiters.length > 0) {
      let bodyStart = index + 1;
      for (const delimiter of pendingDelimiters) {
        const end = heredocEnd(command, bodyStart, delimiter);
        if (end === -1) return command;
        bodies.push({ start: bodyStart, end });
        bodyStart = end;
      }
      pendingDelimiters.length = 0;
      index = bodyStart;
    } else {
      index += 1;
    }
  }
  if (pendingDelimiters.length > 0 || bodies.length === 0) return command;
  let remaining = "";
  let position = 0;
  for (const body of bodies) {
    remaining += command.slice(position, body.start);
    position = body.end;
  }
  remaining += command.slice(position);
  return runsShellCode(remaining) ? command : remaining;
}

/** @param {string[]} args the tokens after `npm` */
function npmSubcommand(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (NPM_OPTIONS_WITH_VALUE.has(arg)) index += 1;
    else if (!arg.startsWith("-")) return { name: arg.toLowerCase(), rest: args.slice(index + 1) };
  }
  return null;
}

/** @param {string[]} args the tokens after `bun`; "" when there is no subcommand */
function bunSubcommand(args) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (BUN_OPTIONS_WITH_VALUE.has(arg)) index += 1;
    else if (!arg.startsWith("-")) return arg.toLowerCase();
  }
  return "";
}

/**
 * True when the command installs dependencies: `npm ci`, `npm install` and aliases, `npm audit fix`,
 * `npx expo install`, `bun install` and the other bun subcommands that write dependencies. Text inside
 * quotes is data (a grep pattern, an echo, a commit message) and does not count, except as the
 * command line of a shell wrapper (`bash -c "npm ci"`) or inside a command substitution
 * (`echo "$(npm ci)"`).
 * @param {string} command
 */
export function isInstallCommand(command) {
  return parseCommand(command).some((segmentTokens) => {
    const tokens = segmentTokens.map((token) => token.text);
    if (isShellWrapper(tokens[0])) {
      return tokens.slice(1).some((arg) => isInstallCommand(arg));
    }
    const hasInstallInSubstitution = segmentTokens.some(
      (token) => token.quoted && /\$\(|`/.test(token.text) && isInstallCommand(token.text.replace(/^[^`$]*(\$\(|`)/, "").replace(/[)`]/g, " ")),
    );
    if (hasInstallInSubstitution) return true;
    const bun = tokens.findIndex((token) => isProgram(token, "bun"));
    if (bun !== -1 && BUN_INSTALL_SUBCOMMANDS.has(bunSubcommand(tokens.slice(bun + 1)))) return true;
    const start = tokens.findIndex((token) => isProgram(token, "npm") || isProgram(token, "npx"));
    if (start === -1) return false;
    const args = tokens.slice(start + 1);
    if (isProgram(tokens[start], "npx")) {
      const expo = args.findIndex((arg) => /^expo(@|$)/i.test(arg));
      return expo !== -1 && args[expo + 1]?.toLowerCase() === "install";
    }
    const subcommand = npmSubcommand(args);
    if (!subcommand) return false;
    if (NPM_INSTALL_SUBCOMMANDS.has(subcommand.name)) return true;
    return subcommand.name === "audit" && subcommand.rest.some((arg) => arg.toLowerCase() === "fix");
  });
}

/**
 * True when the command contains a `gh api` call that names the `agent-klaar` context, also inside a
 * shell wrapper (`bash -c "gh api ..."`). Text quoted as an argument of another program (a commit
 * message, a grep pattern) is data and does not count.
 * @param {string} command
 */
export function isAgentReadyStatusCall(command) {
  return parseCommand(command).some((segmentTokens) => {
    const tokens = segmentTokens.map((token) => token.text);
    if (isShellWrapper(tokens[0])) {
      return tokens.slice(1).some((arg) => isAgentReadyStatusCall(arg));
    }
    const start = tokens.findIndex((token) => isProgram(token, "gh"));
    if (start === -1 || !tokens.slice(start + 1).includes("api")) return false;
    return tokens.slice(start + 1).some((token) => token.includes(AGENT_READY_CONTEXT));
  });
}

/**
 * True when the whole command is exactly the accepted `agent-klaar` form for this repo.
 * @param {string} command
 */
export function isAgentReadyCommand(command) {
  return AGENT_READY_PATTERN.test(command.trim());
}

/** @param {string} directory an absolute path, Windows or POSIX style */
export function isInsideWorktree(directory) {
  return WORKTREE_SEGMENT.test(directory.replace(/\\/g, "/"));
}

/**
 * Normalizes an absolute path for comparison: forward slashes, lower case, and the Git Bash form
 * `/c/...` rewritten to `c:/...`.
 * @param {string} absolutePath
 */
function normalizeAbsolutePath(absolutePath) {
  return absolutePath
    .replace(/\\/g, "/")
    .replace(/^\/([a-z])(\/|$)/i, "$1:/")
    .toLowerCase();
}

/**
 * The normalized root of the worktree that contains the directory, or null outside a worktree.
 * @param {string} directory
 */
function worktreeRoot(directory) {
  const match = normalizeAbsolutePath(directory).match(WORKTREE_ROOT);
  return match ? match[0] : null;
}

/**
 * True when the command names a path that can leave the current worktree: an absolute path outside
 * the worktree of `cwd`, a home-relative path or a `..` segment. Relative paths such as `cms`, and
 * absolute paths inside the worktree of `cwd`, stay inside it.
 * @param {string} command
 * @param {string} [cwd] the directory the command runs in
 */
export function referencesOutsidePath(command, cwd = "") {
  const root = worktreeRoot(cwd);
  const isInsideOwnWorktree = (part) => {
    if (!root) return false;
    const normalized = normalizeAbsolutePath(part);
    return normalized === root || normalized.startsWith(`${root}/`);
  };
  return command
    .split(COMMAND_SEPARATOR)
    .flatMap(tokenize)
    .flatMap((token) => token.split(/=|\d?>+/))
    .filter((part) => !HARMLESS_ABSOLUTE_PATHS.has(part))
    .some((part) => {
      if (/^~/.test(part) || /(^|[\\/])\.\.([\\/]|$)/.test(part)) return true;
      const isAbsolute = /^[a-z]:[\\/]/i.test(part) || /^[\\/]/.test(part);
      return isAbsolute && !isInsideOwnWorktree(part);
    });
}

/**
 * The reason to deny the tool call, or null to leave it to the normal permission flow.
 * @param {{ tool_name?: string, tool_input?: { command?: string }, cwd?: string }} input hook input
 */
export function denyReason(input) {
  const rawCommand = input.tool_input?.command;
  if (!GUARDED_TOOLS.includes(input.tool_name ?? "") || typeof rawCommand !== "string") return null;
  const command = input.tool_name === HEREDOC_TOOL ? stripHeredocBodies(rawCommand) : rawCommand;
  if (isAgentReadyStatusCall(command) && !isAgentReadyCommand(rawCommand)) {
    return `The \`${AGENT_READY_CONTEXT}\` status may only be set with exactly \`${AGENT_READY_COMMAND}\` as a command of its own, with <sha> replaced by the full 40-character SHA from \`git rev-parse HEAD\` typed in literally: no \`$(...)\`, no variable, no other repo, no extra arguments. Retry once in that form; if it is refused too, stop and report.`;
  }
  if (!isInstallCommand(command)) return null;
  if (!isInsideWorktree(input.cwd ?? "")) {
    return "Installs are only allowed in your own worktree under .claude/worktrees/, never in the main checkout. Do not retry in another shell: stop and report.";
  }
  if (referencesOutsidePath(command, input.cwd)) {
    const allowedForms = ALLOWED_INSTALL_FORMS.map((form) => `\`${form}\``).join(" or ");
    return `Installs must stay inside your own worktree: no paths outside it, no '..' and no '~'. Retry once with exactly ${allowedForms} from the worktree root. Do not use the other shell or another rewrite; if the retry is refused too, stop and report.`;
  }
  return null;
}

function main() {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const reason = denyReason(input);
  if (!reason) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
    }),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
