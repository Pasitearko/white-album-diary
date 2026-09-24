# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues in **`Pasitearko/white-album-diary`**. Use the `gh` CLI for all operations.

**Always pass `--repo Pasitearko/white-album-diary`.** This working copy (`D:\日记网站`) is not a git clone — there is no `.git` and no `origin` remote — so `gh` cannot infer the repository from `git remote -v`. Every command below therefore states the repo explicitly. If this directory is ever turned into a clone (`git init` + `git remote add origin`), the flag becomes optional but harmless.

## Conventions

- **Create an issue**: `gh issue create --repo Pasitearko/white-album-diary --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --repo Pasitearko/white-album-diary --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --repo Pasitearko/white-album-diary --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo Pasitearko/white-album-diary --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo Pasitearko/white-album-diary --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo Pasitearko/white-album-diary --comment "..."`

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents (each with `--repo Pasitearko/white-album-diary`):

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo Pasitearko/white-album-diary --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --repo Pasitearko/white-album-diary --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/Pasitearko/white-album-diary/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/Pasitearko/white-album-diary/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --repo Pasitearko/white-album-diary --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --repo Pasitearko/white-album-diary --body "<answer>"`, then `gh issue close <n> --repo Pasitearko/white-album-diary`, then append a context pointer (gist + link) to the map's Decisions-so-far.
