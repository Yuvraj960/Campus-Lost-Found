# GEMINI.md — Antigravity overrides for Campus Lost & Found

Read and follow `AGENTS.md` first; it is the canonical rulebook. This file only adds Antigravity-specific behavior. If the two ever conflict, `AGENTS.md` wins except where this file says otherwise.

## How to work in Antigravity
- Start every task in **Planning mode**. Produce an Implementation Plan artifact before code; keep it under ~25 lines.
- Use a Task List artifact mirroring the phase checkboxes in `docs/TASKS.md`.
- Run terminal commands yourself (install, lint, test, dev server). Report exact failing output when stuck.
- For any UI change, **verify in the browser**: open the dev server, walk the acceptance flow from `docs/TASKS.md`, and attach a screenshot artifact. Check at mobile (≈375px) and desktop widths.
- Prefer `/build-phase`, `/add-feature`, `/fix-bug`, `/security-audit`, `/ui-audit`, `/write-tests`, `/ship` workflows in `.agents/workflows/` when the user invokes them.

## Non-negotiables (repeated because they matter most)
1. Follow docs in `docs/`; never invent endpoints, fields or routes.
2. Work one phase at a time; stop when it is done.
3. Never commit `.env` or secrets; never expose API keys to the client.
4. Never return password fields. Validate all input with Zod. Hide reporter contact info until a claim is approved.
5. Small commits, conventional messages, one branch per phase (`phase/<n>-<slug>`).
6. If blocked by missing info (e.g. API key), use the documented fallback (AI heuristic matcher, mock uploads in dev) and say so — do not stall.

## Tone of your reports
Short, factual, no marketing language. List what changed, how to run it, what to check, and any deviation from the docs.
