---
description: Add a small feature not covered by TASKS.md, docs-first, without touching unrelated code
---
Usage: `/add-feature <one-sentence description>`.

1. Restate the feature and list which docs it affects (API_SPEC, DATA_MODEL, UI_SPEC).
2. Update those docs first (minimal edits). Show the diff summary.
3. Plan: backend (validator → service → controller → route → test), then frontend (service → hook → component/page).
4. Implement on branch `feat/<slug>`. Keep changes scoped; do not refactor unrelated files.
5. Add or update tests. Run lint + tests. Verify in browser if UI changed.
6. Commit, then give the final report.
