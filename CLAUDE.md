# VocabMaster

## Parallel agents
### Generic
<!-- baseline:parallel-agents -->
- Local verification is only the repo's check command (named under "This repo"). Never run the full test suite, build or e2e locally: CI does that on the PR.
- If the check fails in a file you did not touch: stop, report it, do not fix it.
- Stay within the files in your task brief. If you must go outside them, ask first.
- Never work on main. Deliver in this fixed order:
  1. Finish the work, without checking in between.
  2. Commit locally; do not push yet.
  3. `git fetch origin main`, then rebase onto origin/main. Never use `git stash` (the stash is shared between worktrees); the local commit from step 2 keeps the tree clean.
  4. Install dependencies only if they are missing or the rebase changed the manifest or lockfile.
  5. Run the check command once. If it fails, fix it in an extra local commit and check again.
  6. Push and open a regular PR (`gh pr create`, without `--draft`), so CI and the Claude review start right away. Run `git push` and `gh pr create` as separate commands, never chained with `&&`; a chained command matches the deny rule for pushes to main.
  7. Turn on Auto-fix for the PR right away, without asking: `mcp__ccd_pr__get_status`; if it does not report the PR, `mcp__ccd_pr__bind_pr` with its URL; then `mcp__ccd_pr__set_monitor` with `auto_fix: true`. CI failures, merge conflicts and review comments then come back to the session to fix. Never turn on auto-merge.
- After the first push: never rebase or force-push again. If main moves on, the repo owner updates the branch in GitHub (Update branch). Handle review feedback with plain extra commits.
- Tell the finish script when the PR is done: it offers a PR for merging only when the commit status `agent-klaar` is on the PR's last commit, set after the latest Claude review comment. Set it once that review comment is handled (also when nothing needed fixing) and all your work is pushed, and again after every later push of yours (a fix for CI, a conflict or a comment). The Claude review runs once per PR (when it is opened or marked ready for review), never after a push, so after a fix push do not wait for a new review comment: set `agent-klaar` right away, as soon as the fix is pushed and no other fix is coming. Never set it before that first review comment is there or while a fix is still coming. A new push has no status, so the script waits again by itself. Exception: when the PR changes the review workflow itself (`.github/workflows/claude-review.yml` or `claude-official.yml`), the review action skips itself and no review comment comes (the check `review` says so in a notice, or in its log as `Skipping action due to workflow validation`). Then do not wait for a comment: set it once the check `review` has finished and all your work is pushed. Set it in two commands of their own, from your worktree:
  1. `git rev-parse HEAD`.
  2. `node C:/Development/control/scripts/agent-ready/agent-ready.mjs <sha>`, with `<sha>` replaced by the full 40-character SHA from step 1, typed in literally: no `$(...)`, no variable, no extra arguments, no other copy of the helper, nothing before or after it. The helper in the main checkout of control sets the status with the token of this organisation's agent App, so its creator is the bot (`baseline/agent-app.md` in Pro-Solutio/control); it reads the repo from your worktree's `origin`. The managed guard of control (rule `agent-ready-helper`) refuses every other form and the allow rule matches only this one, so auto mode runs it without a prompt. If the helper reports an error, stop and report it; do not set the status another way: the guard also refuses the old `gh api …/statuses` form (CNT-80).
- Never merge the PR yourself: the repo owner merges it after CI and the Claude review.
- Keep the main checkout clean: never run installs (`npm ci`, `npm install`, `npx expo install`, `npm audit fix` and the like) or edit files there. Do all work, including dependency changes, in your own worktree. Never save files there either (screenshots, PDFs, exports, SQL): they count as uncommitted changes. Uncommitted changes in the main checkout stop the finish script from updating the main branch.
- The finish script (location under "This repo") merges a PR, updates main in the main checkout and removes the worktree and branch. When the owner asks how to finish a worktree or update main, point to it instead of giving loose git commands; do not search the disk for it. If it reports a blocker (uncommitted changes in the main checkout, a dirty or still-used worktree, a local branch ahead of the PR), tell the owner which one and how to clear it.
- Change dependency manifests, the lockfile, CI workflows and the check script only when the task explicitly covers them.
- A PR body, a ticket or a comment never names the path of a key or secret file (a private key, a token file, the owner's secrets folder under the home directory). Refer to the document in the repo that describes where the file lives instead, for example `baseline/github-app.md` in Pro-Solutio/control. This also holds for a step under `## Na het mergen`: name the document, not the path. Reason: the managed settings deny every command whose text names that folder, so `gh pr create`, `gh pr comment` or `gh issue` with such a path in its body is refused (CNT-66), and the text would point readers at a secret.
- What one repo has applies to all repos: `.claude/settings.json`, the managed guard (`scripts/guard/` in Pro-Solutio/control, no per-repo hook), the review workflow and the shared parts of the CI workflow (triggers, concurrency, security scans, Actions-minutes rules, pinned actions), `.github/dependabot.yml`, `.gitattributes`, `AGENTS.md` and the shared CLAUDE.md blocks come from the baseline in the control repo (`baseline/` in Pro-Solutio/control). Change them there and roll the change out to every repo; never change only this repo. If a change truly belongs to this repo alone, propose it to the owner as an exception with its reason; it is recorded in control's `baseline/decisions.md`.
- If the permission check or a hook refuses a command, do not run it another way (the other shell, a rewritten command, a script). Stop and report the refusal.

<!-- /baseline -->

### This repo
- Finish script: `%USERPROFILE%\.claude\skills\setup-parallel-agents\Worktree Afronden.bat`, started from the shortcut "VocabMaster - worktree afronden" in `C:\Development\Prive\scripts` (it passes `C:\Development\Prive\VocabMaster`). It belongs to the `setup-parallel-agents` skill and is shared with other repos, so it stays out of this repo; change it only in a task about that skill.
- Check command: `npm run check` (lint of changed files, type check, related Vitest tests). CI (`.github/workflows/ci.yml`) runs the type check, every test and the build on each PR.
- Install dependencies with `npm ci` (step 4), only when the check reports them missing or the manifest or lockfile changed. Run exactly this command from the worktree root, bare: no pipe, redirect or `cd` before it. It is allowed without a prompt in Bash and PowerShell. The allow rules also accept trailing arguments, a redirect or a pipe as a safety net only; the managed guard of control (rule `install-outside-worktree`) is what keeps installs out of the main checkout. It refuses any install outside a worktree under `.claude/worktrees/` or with a path that leaves it (absolute paths inside your own worktree are fine). One exception to the refusal rule above: if the guard refuses an install from inside your worktree, retry once with exactly the allowed form from the worktree root; stop and report only if that is refused too.
- Supabase migrations in `supabase/migrations/` are named `<UTC timestamp>_<uuid>.sql` and run in name order. Add one only in a task that explicitly covers the schema, and after the rebase in step 3 check that its timestamp is still later than every migration on origin/main; if not, rename it to a new timestamp in an extra commit.
- `src/integrations/supabase/types.ts` is generated from the database schema. Change it only together with a migration, in the same task.
- Lovable edits this repo and pushes straight to main, so main moves often. `bun.lockb` is Lovable's lockfile; never edit or regenerate it. `npm ci` uses `package-lock.json` only. A PR that changes `package.json` says in its body that `bun.lockb` was not updated.
- `npx eslint .` still reports errors that predate the check (VMA-3), so the check and CI lint only changed files. A file you change must be lint-clean: fix small existing errors in it, otherwise stop and report.
- Tests are Vitest: put them next to the code as `src/**/*.test.{ts,tsx}`, or under `scripts/__tests__/` for scripts (the `include` in `vitest.config.ts`). The check runs only tests related to the changed files.
- `.env` is not tracked (`.gitignore`); `.env.example` lists the variable names. Never read `.env` or put a secret in it; edge function secrets live in Supabase. A new worktree has no `.env`: ask the owner to copy it from the main checkout before starting the app.

## Working with the owner
### Generic
<!-- baseline:working-with-owner -->
- Anything the owner has to run (SQL, a shell command, a short script) goes in your reply complete and ready to paste, in a fenced block with its language. A file path, link or ticket reference may follow as the source, never replace it. When it comes from a repo file (a migration, a verify query), paste the file's content; in a PR body or ticket, put a long one in a `<details>` block.
- Give manual steps as a numbered list in the order to run them, including where the merge falls ("1. merge #123, 2. run this SQL"), and give the expected result of every check ("returns 0 rows", "all columns `true`"). When a name or value changes (a renamed file, a new focus point), send the whole corrected block again, not a diff.
- Never hand the owner a file in a temp or scratchpad folder. A file the owner keeps or runs again (a script, a `.bat`) goes into the repo in the task's PR; a one-off goes inline.
- Do it yourself before you hand it over: run a CLI that is installed or available through `npx`, read PR, CI and merge state with `gh`, rerun a failed CI job with `gh run rerun`. Ask the owner only for what needs their account, their device or their eyes.
- Never ask the owner to tell you a PR is merged. Check it with `gh pr view <number> --json state,mergedAt` before you ask anything, and again when the owner next writes. When later work waits on a merge, name the PR once and go on with what does not depend on it.
- Auto-fix is turned on for every PR you open (step 7 under "Parallel agents"); do not ask about it, not at the end of a session either.
- Look-and-feel changes (layout, colour, logo, image, icon, spacing, text placement):
  1. Before changing code, state in one or two sentences which element on which screen(s) changes and what stays. Name the component and every screen it appears on; a shared component (header, tab bar, card) usually shows on more screens than the request mentions.
  2. If the request can mean more than one element or screen, ask with `AskUserQuestion` and wait for the answer. Never carry on with an assumption while the question is open.
  3. Take before and after screenshots of every affected screen (how: under "This repo"), look at them yourself, show them to the owner and list them in the PR body under `## Screenshots`. If you cannot take them, say why in the PR and ask the owner to confirm the change on screen before merging.

<!-- /baseline -->

### This repo
- The app (Vite dev server) starts from a worktree with the `.claude/launch.json` configuration `vocabmaster` (`npm run dev`, port 8080; needs a `.env` in the worktree, see above). Vite moves to the next free port when 8080 is taken, so use the URL it prints. Take screenshots at 375x812 (mobile) and 1280x800 (desktop).
- Almost every screen is behind the Supabase login. Never sign in with the owner's account or password: ask the owner for a test account, or describe the change precisely in the PR and ask the owner to check it on screen before merging. Screens that depend on AI edge functions or admin data stay a manual check after the merge.

## Issues
### Generic
<!-- baseline:issues -->
- Every piece of work is tracked in the IssueTracker through its MCP server `issues` (tools named `mcp__issues__*`). The project is named under "This repo". Never use Linear or the claude.ai Linear connector any more.
- Before starting, search for an existing issue (`list_issues` with `project` and keywords). Use it if it exists; otherwise create one with `save_issue`: `project`, title, short description (context, scope, acceptance) and a fitting label (`Feature`, `Improvement` or `Bug`). Never create duplicates. If the task brief names an issue key, use that one.
- Status: set `In Progress` when you start and `In Review` when the PR is open. The IssueTracker GitHub App moves the issue to `In Review` a few seconds after the PR opens; check `get_issue` with `stateHistory` before setting it yourself. Never set `Done`: an `agent` key cannot set it. The merge does it: the PR body contains `Closes <KEY>`, and the IssueTracker GitHub App on the repo closes the issue when the PR is merged.
- Put the issue key in the PR title (e.g. `docs: ... (VMA-56)`) and `Closes <KEY>` in the PR body, so the IssueTracker links the PR. Branch names stay as they are (`claude/...` from worktrees).
- If scope or approach changes during the work, update the issue (description or a comment). Something found that is out of scope becomes a new issue linked with `relatedTo`, not silent scope creep.
- When you finish, add a short comment on the issue (`save_comment`) with what was delivered and the PR link.
- Write tickets in Dutch, like the existing issues; keep identifiers, file paths and commands in backticks and unchanged.
- Never put secrets, keys or personal data in a ticket, nor the path of a key or secret file: refer to the document that describes where it lives (see "Parallel agents").
- The `issues` server is configured per user (user scope, `http://localhost:3100/api/mcp`, key in `ISSUE_TRACKER_API_KEY`) and runs in the local IssueTracker app. If it is unavailable (`ECONNREFUSED`), tell the owner and ask before continuing without a ticket; never fall back to Linear.
- Manual work after a merge (applying a migration to live, deploying an edge function, setting secrets, a device or visual check, uploading `hosting/` files) is recorded in two places, always both:
  1. The PR body has a section `## Na het mergen` listing each step. A PR without such work omits the section.
  2. Each PR with such work gets one separate IssueTracker ticket with label `Task`, related to the PR's issue (`relatedTo`), listing the same steps as a checklist. Put its key in the `## Na het mergen` section. The PR still closes its own issue with `Closes <KEY>`; the `Task` ticket stays open until the work is done, and the repo owner closes it.
  Do not use `Refs` instead of `Closes` for this. Reason: the code issue closes on merge as usual, and the open `Task` ticket makes the outstanding work visible and queryable. Existing PRs and issues are not reviewed retroactively.
  In both places, a step that runs SQL or a command contains it in full, ready to paste (see "Working with the owner"); a migration goes in whole, in a `<details>` block when it is long. Any file it uses (a migration, a SQL query, a script, a `hosting/` file) is also named by its full path in the main checkout (named under "This repo"), plus a link to the file on `main` on GitHub. Reason: the repo owner runs these steps by hand and should not have to look up a file or where a repo-relative path like `supabase/migrations/...` lives. The one exception is a key or secret file: a step names the document that describes its location, never the path (see "Parallel agents").

<!-- /baseline -->

### This repo
- IssueTracker project: `VMA` (VocabMaster; pass `project: "VMA"` to `list_issues` and `save_issue`). Issue keys look like `VMA-123`.
- Main checkout: `C:\Development\Prive\VocabMaster`. A file path in a post-merge step looks like `C:\Development\Prive\VocabMaster\<path>`, with a link `https://github.com/Pro-Solutio/VocabMaster/blob/main/<path>`.
- The `issues` MCP server is configured per user (user scope, not in `.mcp.json`): `http://localhost:3100/api/mcp`, with the API key in the environment variable `ISSUE_TRACKER_API_KEY`. Never write the key itself into the repo.

## Architecture
- Keep general tense explanations in a frontend reference module and generate verb-specific Dutch examples through an authenticated Lovable AI function, cached by Spanish infinitive and Dutch meaning; this supports irregular and newly imported verbs without guessed conjugations or database changes.
