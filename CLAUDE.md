# VocabMaster

Architecture rules live in `AGENTS.md`.

## Issues
### Generic
<!-- baseline:issues -->
- Every piece of work is tracked in the IssueTracker through its MCP server `issues` (tools named `mcp__issues__*`). The project is named under "This repo". Never use Linear or the claude.ai Linear connector any more.
- Before starting, search for an existing issue (`list_issues` with `project` and keywords). Use it if it exists; otherwise create one with `save_issue`: `project`, title, short description (context, scope, acceptance) and a fitting label (`Feature`, `Improvement` or `Bug`). Never create duplicates. If the task brief names an issue key, use that one.
- Status: set `In Progress` when you start and `In Review` when the PR is open. The IssueTracker GitHub App moves the issue to `In Review` a few seconds after the PR opens; check `get_issue` with `stateHistory` before setting it yourself. Never set `Done`: an `agent` key cannot set it. The merge does it: the PR body contains `Closes <KEY>`, and the IssueTracker GitHub App on the repo closes the issue when the PR is merged.
- Put the issue key in the PR title (e.g. `docs: ... (VMA-1)`) and `Closes <KEY>` in the PR body, so the IssueTracker links the PR. Branch names stay as they are (`claude/...` from worktrees).
- If scope or approach changes during the work, update the issue (description or a comment). Something found that is out of scope becomes a new issue linked with `relatedTo`, not silent scope creep.
- When you finish, add a short comment on the issue (`save_comment`) with what was delivered and the PR link.
- Write tickets in Dutch, like the existing issues; keep identifiers, file paths and commands in backticks and unchanged.
- Never put secrets, keys or personal data in a ticket.
- The `issues` server is configured per user (user scope, `http://localhost:3100/api/mcp`, key in `ISSUE_TRACKER_API_KEY`) and runs in the local IssueTracker app. If it is unavailable (`ECONNREFUSED`), tell the owner and ask before continuing without a ticket; never fall back to Linear.
- Manual work after a merge (applying a migration to live, deploying an edge function, setting secrets, a device or visual check) is recorded in two places, always both:
  1. The PR body has a section `## Na het mergen` listing each step. A PR without such work omits the section.
  2. Each PR with such work gets one separate IssueTracker ticket with label `Task`, related to the PR's issue (`relatedTo`), listing the same steps as a checklist. Put its key in the `## Na het mergen` section. The PR still closes its own issue with `Closes <KEY>`; the `Task` ticket stays open until the work is done, and the repo owner closes it.
  Do not use `Refs` instead of `Closes` for this. Reason: the code issue closes on merge as usual, and the open `Task` ticket makes the outstanding work visible and queryable.
  In both places, a step that runs SQL or a command contains it in full, ready to paste; a migration goes in whole, in a `<details>` block when it is long. Any file it uses (a migration, a SQL query, a script) is also named by its full path in the main checkout (named under "This repo"), plus a link to the file on `main` on GitHub. Reason: the repo owner runs these steps by hand and should not have to look up a file or where a repo-relative path like `supabase/migrations/...` lives.

<!-- /baseline -->

### This repo
- IssueTracker project: `VMA` (VocabMaster; pass `project: "VMA"` to `list_issues` and `save_issue`). Issue keys look like `VMA-123`.
- Main checkout: `C:\Development\Prive\VocabMaster`. A file path in a post-merge step looks like `C:\Development\Prive\VocabMaster\<path>`, with a link `https://github.com/Pro-Solutio/smart-speller/blob/main/<path>`.
- The `issues` MCP server is configured per user (user scope, not in `.mcp.json`): `http://localhost:3100/api/mcp`, with the API key in the environment variable `ISSUE_TRACKER_API_KEY`. Never write the key itself into the repo.
