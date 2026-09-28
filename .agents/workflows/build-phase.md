---
description: Build the next (or a named) phase from docs/TASKS.md end to end, verify, and commit
---
Usage: `/build-phase` (next unfinished phase) or `/build-phase 4`.

1. Read `AGENTS.md`, `docs/TASKS.md`, `docs/PROGRESS.md`. Pick the phase given as argument, else the first phase with unchecked boxes.
2. Read the docs listed under that phase's **Read** line.
3. Write a short Implementation Plan (files to create/change, order). If it would deviate from the docs, stop and ask.
4. Create branch `phase/<n>-<slug>`.
5. Implement the phase tasks in order. Run lint/tests after each logical task and commit with a conventional message.
6. Run the phase **Verify** steps. For UI work, start the dev servers, open the app in the browser, walk the acceptance flow at ~375px and ~1280px, and attach screenshots.
7. Fix failures. After 3 failed attempts on the same error, stop and report the exact error output.
8. Tick the phase checkboxes in `docs/TASKS.md` and append an entry to `docs/PROGRESS.md`.
9. Finish with the final report format from `AGENTS.md`. Do not start the next phase.
