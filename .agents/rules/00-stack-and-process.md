---
trigger: always_on
description: Project-wide process, git and dependency rules
---
# Process & Git
- Branch per phase: `phase/<n>-<slug>` from `main`. Merge to `main` only when Verify passes.
- Conventional commits: `feat(items): add filter query`, `fix(auth): reject suspended users`, `test(claims): ...`, `docs: ...`, `chore: ...`.
- Commit after each logical task, not once at the end. Never `git push --force`, never rewrite history.
- Never commit `.env`, `node_modules`, build output or uploaded files.
- Add a dependency only if it is in AGENTS.md Stack, or state the reason in the report.
- Keep files small: controllers < 150 lines, components < 200 lines. Split when larger.
- Prefer boring, readable code. The developer reads every file: name things clearly, add a one-line comment above non-obvious logic.
- When unsure between two designs, choose the one already used elsewhere in the repo.
- Update `docs/PROGRESS.md` at the end of every task with date, phase, what changed, follow-ups.
