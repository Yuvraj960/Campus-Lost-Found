# Campus Lost & Found — Antigravity Agent Kit

Planning/rules pack for vibe-coding the MERN Campus Lost & Found app in Google Antigravity. It contains no app code; the agent generates it phase by phase from these files.

## Setup
1. Create an empty folder for the project and copy everything in this kit into it (keep the structure, including hidden `.agents/`).
2. Open the folder as a workspace in Antigravity.
3. Confirm Antigravity sees the rules and workflows (Customizations / Rules & Workflows panel). Type `/` in the agent chat to see the workflows. If they don't appear, check whether your version uses `.agents/` or the older `.agent/` folder name and rename accordingly.
4. Put your keys in `server/.env` after Phase 0 (Gemini and Cloudinary keys can wait until Phases 6–7).
5. Paste the first prompt from `PROMPTS.md`.

## Kit map
| File | Purpose |
|---|---|
| `AGENTS.md` | Canonical always-on rules (cross-tool) |
| `GEMINI.md` | Antigravity-specific behavior (planning, browser verification) |
| `.agents/rules/` | Process/git, backend, frontend, security rules (backend/frontend load only for matching paths) |
| `.agents/workflows/` | Slash commands: `/build-phase /add-feature /fix-bug /security-audit /ui-audit /write-tests /ship` |
| `docs/` | PRD, architecture, data model, API spec, UI spec, AI matching, TASKS (11 phases), PROGRESS log |
| `PROMPTS.md` | The few prompts you actually need to paste |

## Workflow in one line
`/build-phase` → review the plan → let it run → check the "Check manually" list → merge → repeat.
