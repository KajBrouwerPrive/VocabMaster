import { AGENT_READY_COMMAND, AGENT_READY_REPO, ALLOWED_INSTALL_FORMS, denyReason, isInsideWorktree, isInstallCommand, referencesOutsidePath, stripHeredocBodies } from "../guard-install.mjs";

const MAIN_CHECKOUT = "C:\\Development\\Prive\\VocabMaster";
const WORKTREE = "C:\\Development\\Prive\\VocabMaster\\.claude\\worktrees\\some-task-1a2b3c";

describe("isInstallCommand", () => {
  it.each([
    "npm ci --prefix cms",
    "npm ci --prefix mobile",
    "npm --prefix cms ci",
    "npm -C mobile ci",
    "npm install",
    "npm i left-pad",
    "npm.cmd ci --prefix cms",
    "npm clean-install",
    "npm update",
    "npm audit fix --force",
    "npx expo install expo-camera",
    "npx expo@latest install",
    "bun install",
    "bun i",
    "bun add zod",
    "bun.exe update",
    "bunx vite && bun install --frozen-lockfile",
    "npm run check && npm ci --prefix cms",
    "cd cms; npm ci",
    'git commit -m "fix: x" && npm ci --prefix cms',
    'bash -c "npm ci --prefix cms"',
    "sh -c 'cd mobile && npx expo install expo-camera'",
    'powershell -Command "npm install"',
    'echo "$(npm ci)"',
    '"npm" ci',
    'npm "ci"',
  ])("flags %s", (command) => {
    expect(isInstallCommand(command)).toBe(true);
  });

  it.each([
    "npm run check",
    "npm --prefix cms run dev",
    "npm audit",
    "npm ls",
    "npx expo start",
    "bun run dev",
    "bun --version",
    "bunx vitest",
    "git status",
    "npm run test -- install",
    "echo npm",
    'grep -n "install\\|node_modules\\|npm ci" CLAUDE.md',
    'echo "npm ci"',
    "echo 'npm install && npm ci'",
    'git commit -m "docs: explain why npm install is refused"',
    'git commit -m "a; b | npm ci"',
    'bash -c "npm run check"',
  ])("leaves %s alone", (command) => {
    expect(isInstallCommand(command)).toBe(false);
  });
});

describe("isInsideWorktree", () => {
  it("accepts a worktree root and its subdirectories, in Windows and POSIX form", () => {
    expect(isInsideWorktree(WORKTREE)).toBe(true);
    expect(isInsideWorktree(`${WORKTREE}\\cms`)).toBe(true);
    expect(isInsideWorktree("/c/Development/Prive/VocabMaster/.claude/worktrees/some-task")).toBe(true);
  });

  it("rejects the main checkout and the worktrees folder itself", () => {
    expect(isInsideWorktree(MAIN_CHECKOUT)).toBe(false);
    expect(isInsideWorktree(`${MAIN_CHECKOUT}\\cms`)).toBe(false);
    expect(isInsideWorktree(`${MAIN_CHECKOUT}\\.claude\\worktrees`)).toBe(false);
    expect(isInsideWorktree("")).toBe(false);
  });
});

describe("referencesOutsidePath", () => {
  it.each([
    "npm ci --prefix C:\\Development\\Prive\\VocabMaster\\cms",
    "npm ci --prefix C:/Development/Prive/VocabMaster/cms",
    "npm ci --prefix /c/Development/Prive/VocabMaster/cms",
    "npm ci --prefix ../../../cms",
    "npm ci --prefix=..\\..\\cms",
    "npm ci --prefix ~/VocabMaster/cms",
    "cd ..; npm ci",
  ])("flags %s", (command) => {
    expect(referencesOutsidePath(command)).toBe(true);
  });

  it.each(["npm ci --prefix cms", "npm ci --prefix ./mobile", "cd cms && npm ci", "npm ci --prefix cms > /dev/null 2>&1", "npm ci --prefix cms 2>/dev/null"])(
    "allows %s",
    (command) => {
      expect(referencesOutsidePath(command)).toBe(false);
    },
  );

  it.each([
    `cd ${WORKTREE} && npm ci --prefix cms`,
    `cd "${WORKTREE}"; npm ci --prefix cms`,
    `npm ci --prefix ${WORKTREE}\\cms`,
    "cd C:/development/prive/vocabmaster/.claude/worktrees/SOME-TASK-1a2b3c && npm ci --prefix mobile",
    "cd /c/Development/Prive/VocabMaster/.claude/worktrees/some-task-1a2b3c/mobile && npx expo install expo-updates",
  ])("allows an absolute path inside the worktree of cwd: %s", (command) => {
    expect(referencesOutsidePath(command, `${WORKTREE}\\cms`)).toBe(false);
  });

  it.each([
    `cd ${MAIN_CHECKOUT} && npm ci --prefix cms`,
    "cd C:\\Development\\Prive\\VocabMaster\\.claude\\worktrees\\other-task && npm ci --prefix cms",
    "cd C:\\Development\\Prive\\VocabMaster\\.claude\\worktrees\\some-task-1a2b3c-copy && npm ci --prefix cms",
    `cd ${WORKTREE}\\..\\other-task && npm ci --prefix cms`,
  ])("flags an absolute path outside the worktree of cwd: %s", (command) => {
    expect(referencesOutsidePath(command, WORKTREE)).toBe(true);
  });
});

describe("denyReason", () => {
  const call = (toolName, command, cwd) => denyReason({ tool_name: toolName, tool_input: { command }, cwd });

  it.each(["Bash", "PowerShell"])("denies npm ci in the main checkout via %s", (toolName) => {
    expect(call(toolName, "npm ci --prefix cms", MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
  });

  it.each(["Bash", "PowerShell"])("lets the bare allowed form through in a worktree and denies it in the main checkout via %s", (toolName) => {
    expect(call(toolName, "npm ci", WORKTREE)).toBeNull();
    expect(call(toolName, "npm ci", MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
    expect(call(toolName, "bun install", MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
  });

  it.each(["Bash", "PowerShell"])("lets npm ci in a worktree through via %s", (toolName) => {
    expect(call(toolName, "npm ci --prefix cms", WORKTREE)).toBeNull();
    expect(call(toolName, "npm ci --prefix mobile", WORKTREE)).toBeNull();
  });

  // The allow rules `npm ci --prefix cms|mobile *` also match these forms, so the hook alone keeps
  // them out of the main checkout.
  const trailingForms = [
    "npm ci --prefix cms 2>&1 | tail -3",
    "npm ci --prefix mobile > /dev/null 2>&1",
    "npm ci --prefix cms --no-audit --no-fund",
    "npm ci --prefix mobile 2>&1 | Select-Object -Last 3",
  ];

  it.each(trailingForms)("denies %s in the main checkout", (command) => {
    expect(call("Bash", command, MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
    expect(call("PowerShell", command, MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
  });

  it.each(trailingForms)("lets %s in a worktree through", (command) => {
    expect(call("Bash", command, WORKTREE)).toBeNull();
    expect(call("PowerShell", command, WORKTREE)).toBeNull();
  });

  it("denies an install from a worktree that redirects its output outside it", () => {
    expect(call("Bash", "npm ci --prefix cms > C:\\Development\\Prive\\VocabMaster\\install.log", WORKTREE)).toMatch(/stay inside your own worktree/);
  });

  it("denies an install from a worktree that targets a path outside it", () => {
    expect(call("PowerShell", "npm ci --prefix C:\\Development\\Prive\\VocabMaster\\cms", WORKTREE)).toMatch(/stay inside your own worktree/);
    expect(call("Bash", "cd ../.. && npm ci --prefix cms", WORKTREE)).toMatch(/stay inside your own worktree/);
  });

  it.each(["Bash", "PowerShell"])("lets a relative npx expo install in a worktree through via %s", (toolName) => {
    expect(call(toolName, "cd mobile && npx expo install expo-updates", WORKTREE)).toBeNull();
    expect(call(toolName, "cd mobile; npx expo install expo-updates", WORKTREE)).toBeNull();
  });

  it.each(["Bash", "PowerShell"])("lets an install that changes to an absolute path inside the own worktree through via %s", (toolName) => {
    expect(call(toolName, `cd ${WORKTREE} && npm ci --prefix cms`, `${WORKTREE}\\cms`)).toBeNull();
    expect(call(toolName, `cd ${WORKTREE}\\mobile && npx expo install expo-updates`, WORKTREE)).toBeNull();
  });

  it("denies an install that changes to another worktree, names the allowed forms and allows one retry", () => {
    const reason = call("Bash", "cd C:\\Development\\Prive\\VocabMaster\\.claude\\worktrees\\other-task && npm ci --prefix cms", WORKTREE);
    expect(reason).toMatch(/stay inside your own worktree/);
    expect(reason).toContain("`npm ci`");
    expect(reason).toMatch(/Retry once/);
  });

  it.each(["Bash", "PowerShell"])("lets quoted install text through even in the main checkout via %s", (toolName) => {
    expect(call(toolName, 'grep -n "install\\|node_modules\\|npm ci" CLAUDE.md', MAIN_CHECKOUT)).toBeNull();
    expect(call(toolName, 'echo "npm ci"', MAIN_CHECKOUT)).toBeNull();
    expect(call(toolName, 'git commit -m "chore: drop npm install step"', MAIN_CHECKOUT)).toBeNull();
  });

  it.each(["Bash", "PowerShell"])("still denies a real install next to or inside quotes via %s", (toolName) => {
    expect(call(toolName, 'echo "ok" && npm ci --prefix cms', MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
    expect(call(toolName, 'bash -c "npm ci --prefix cms"', MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
    expect(call(toolName, 'git commit -m "x" && npm ci --prefix ../other', WORKTREE)).toMatch(/stay inside your own worktree/);
    expect(call(toolName, 'echo "hi"; npm ci --prefix ~/VocabMaster/cms', WORKTREE)).toMatch(/stay inside your own worktree/);
    expect(call(toolName, 'bash -c "cd .. && npm ci"', WORKTREE)).toMatch(/stay inside your own worktree/);
  });

  it("names every allowed install form from the constant in the refusal", () => {
    const reason = call("Bash", "npm ci --prefix ../x", WORKTREE);
    for (const form of ALLOWED_INSTALL_FORMS) expect(reason).toContain(form);
  });

  it("ignores other commands and other tools", () => {
    expect(call("Bash", "npm run check", MAIN_CHECKOUT)).toBeNull();
    expect(call("Read", "npm ci", MAIN_CHECKOUT)).toBeNull();
    expect(denyReason({ tool_name: "Bash", tool_input: {}, cwd: MAIN_CHECKOUT })).toBeNull();
  });
});

describe("heredocs", () => {
  const call = (toolName, command, cwd) => denyReason({ tool_name: toolName, tool_input: { command }, cwd });

  // Heredoc bodies are data (a script for `node -`, a file for `cat`, a commit message), like quoted text.
  it.each([
    "node - <<'EOF'\nconst brief = \"cd mobile && npx expo install <package>\";\nconsole.log(brief, \"~/.claude/skills\");\nEOF",
    "cat <<EOF > notes.md\nnpm ci --prefix ../other\nEOF",
    'cat <<"EOF" > notes.md\nnpm install && cd ~\nEOF',
    "cat <<-EOF > notes.md\n\tnpm ci --prefix C:\\Development\\Prive\\VocabMaster\\cms\n\tEOF",
    "git commit -F - <<'EOF'\ndocs: explain why npm install it's refused\nEOF",
    "cat <<A <<B\nnpm ci\nA\nnpm install\nB",
  ])("lets heredoc data through in the main checkout and a worktree: %s", (command) => {
    expect(call("Bash", command, MAIN_CHECKOUT)).toBeNull();
    expect(call("Bash", command, WORKTREE)).toBeNull();
  });

  it("removes the body and the closing line", () => {
    expect(stripHeredocBodies("node - <<'EOF'\nnpm ci\nEOF\necho done")).toBe("node - <<'EOF'\necho done");
  });

  it("follows backslash escapes in double quotes, so an escaped quote does not expose a heredoc", () => {
    const command = 'echo "\\" <<EOF"\nnpm ci\nEOF';
    expect(stripHeredocBodies(command)).toBe(command);
  });

  it("still denies a real install next to a heredoc", () => {
    expect(call("Bash", "cat <<EOF > a.txt\nhello\nEOF\nnpm ci --prefix cms", MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
    expect(call("Bash", "node - <<'EOF' && npm ci --prefix ../other\nconsole.log(1)\nEOF", WORKTREE)).toMatch(/stay inside your own worktree/);
  });

  // A body that a shell can run is code, and so is a body whose bounds the scanner cannot be sure of.
  it.each([
    "bash <<EOF\nnpm ci --prefix cms\nEOF",
    "sh <<'EOF'\nnpm ci\nEOF",
    "pwsh -Command - <<EOF\nnpm install\nEOF",
    "bash<<EOF\nnpm ci\nEOF",
    "/usr/bin/env bash <<-EOF\n\tnpm ci\n\tEOF",
    "cat <<EOF | bash\nnpm ci\nEOF",
    "cat <<EOF |\nnpm ci\nEOF\nbash",
    "source /dev/stdin <<EOF\nnpm ci\nEOF",
    ". /dev/stdin <<EOF\nnpm ci\nEOF",
    "bash -c \"$(cat <<'EOF'\nnpm ci\nEOF\n)\"",
    'echo "<<EOF"\nnpm ci\nEOF',
    "echo hi # <<EOF\nnpm ci\nEOF",
    'cat <<E"OF"\nhi\nEOF\nnpm ci',
    "cat <<\\EOF\nhi\nEOF\nnpm ci",
    "echo $((1<<2))\nnpm ci\n2",
    "cat <<EOF\nnpm ci",
  ])("still denies an install in the main checkout: %s", (command) => {
    expect(call("Bash", command, MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
  });

  it("still denies a shell-fed heredoc that leaves the worktree", () => {
    expect(call("Bash", "bash <<'EOF'\nnpm ci --prefix ~/VocabMaster/cms\nEOF", WORKTREE)).toMatch(/stay inside your own worktree/);
  });

  it("does not read heredocs in PowerShell, which has none", () => {
    expect(call("PowerShell", "node - <<'EOF'\nnpm ci\nEOF", MAIN_CHECKOUT)).toMatch(/only allowed in your own worktree/);
  });
});

describe("agent-klaar status", () => {
  const call = (toolName, command, cwd = WORKTREE) => denyReason({ tool_name: toolName, tool_input: { command }, cwd });
  const SHA = "0123456789abcdef0123456789abcdef01234567";
  const TAIL = '-f state=success -f context=agent-klaar -f description="Agent done"';
  const exact = `gh api repos/${AGENT_READY_REPO}/statuses/${SHA} ${TAIL}`;

  it("names this repo", () => {
    expect(AGENT_READY_REPO).toBe("KajBrouwerPrive/VocabMaster");
    expect(AGENT_READY_COMMAND).toBe(`gh api repos/KajBrouwerPrive/VocabMaster/statuses/<sha> ${TAIL}`);
  });

  it.each(["Bash", "PowerShell"])("lets exactly the accepted form through via %s", (toolName) => {
    expect(call(toolName, exact)).toBeNull();
    expect(call(toolName, exact, MAIN_CHECKOUT)).toBeNull();
  });

  it.each([
    ["another repo", `gh api repos/Pro-Solutio/elsewhere/statuses/${SHA} ${TAIL}`],
    ["a short SHA", `gh api repos/${AGENT_READY_REPO}/statuses/${SHA.slice(0, 7)} ${TAIL}`],
    ["a command substitution", `gh api repos/${AGENT_READY_REPO}/statuses/$(git rev-parse HEAD) ${TAIL}`],
    ["a variable", `gh api repos/${AGENT_READY_REPO}/statuses/$SHA ${TAIL}`],
    ["an extra state", `gh api repos/${AGENT_READY_REPO}/statuses/${SHA} -f state=failure ${TAIL}`],
    ["trailing arguments", `${exact} -f target_url=https://example.com`],
    ["a chained command", `git rev-parse HEAD && ${exact}`],
    ["a shell wrapper", `bash -c "gh api repos/${AGENT_READY_REPO}/statuses/$(git rev-parse HEAD) -f context=agent-klaar"`],
  ])("denies %s", (_why, command) => {
    expect(call("Bash", command)).toMatch(/may only be set with exactly/);
  });

  it("ignores agent-klaar as quoted data of another program", () => {
    expect(call("Bash", 'git commit -m "set agent-klaar via gh api"')).toBeNull();
  });
});
