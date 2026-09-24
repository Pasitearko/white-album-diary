## Agent skills

### Issue tracker

Issues live as GitHub issues in `Pasitearko/white-album-diary`. This working copy is a clone whose `origin` points at that repository, so `gh` can infer the repo from the remote — commands still pass `--repo Pasitearko/white-album-diary` explicitly so they also work from a session whose working directory is somewhere else. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, one label each: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Line endings

Every text file in this repo uses **LF** (`\n`). Never CRLF.

This is enforced by `.gitattributes` (`* text=auto eol=lf`), which outranks any machine's `core.autocrlf` setting — so the standard holds no matter who clones it or what editor they use.

When writing or editing files here:

- Write LF. Do not introduce CRLF.
- Binary assets (`*.png`, `*.jpg`, `*.jpeg`, `*.webp`, `*.gif`, `*.ico`, `*.jfif`) are marked `binary` in `.gitattributes` and must be left byte-for-byte untouched.
- Verify with `git ls-files --eol`: every text file should read `i/lf` and `w/lf`.
