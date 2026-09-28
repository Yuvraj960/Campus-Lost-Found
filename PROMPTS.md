# Prompts you actually need

## 0. First message (once)
```
Read AGENTS.md, GEMINI.md and every file in docs/. Then run /build-phase 0.
Work in Planning mode, keep the plan short, and stop when Phase 0 is verified.
```

## 1. Every phase after that
```
/build-phase
```
(or `/build-phase 3`). Start a **new conversation per phase** to keep context small; the agent recovers state from `docs/TASKS.md` and `docs/PROGRESS.md`.

## 2. If you want fewer stops
```
Run /build-phase for phases 2 and 3 back to back. Commit per task, stop only on a
blocker or failing verification, and give me one combined report at the end.
```
Good pairs: 2+3, 4+5. Keep 1, 6, 7, 8 separate (UI/AI phases deserve a manual look).

## 3. When something breaks
```
/fix-bug <paste the exact error, the URL/route, and what you clicked>
```

## 4. Quality gates
```
/write-tests all
/security-audit
/ui-audit
/ship
```

## 5. Small additions
```
/add-feature Let owners add an optional "reward offered" note on LOST items
```

## 6. Review habit (do this after every phase)
1. Read the diff of the branch (`git diff main`) — at least the services and models.
2. Run the "Check manually" steps from the report.
3. Ask the agent: "Explain how <feature> works end to end, file by file." (learning step)
4. Merge to `main`, start the next phase in a new chat.

## Antigravity tips
- **Planning mode** for phases; **Fast mode** for tiny fixes.
- Terminal policy: allow the agent to run npm/git/curl commands; keep "review" on for destructive commands.
- Keep the browser agent enabled: `GEMINI.md` tells it to verify UI flows and attach screenshots.
- Don't run parallel agents on the same phase; they'll conflict on shared files.
- If the agent drifts from the docs, say: "Re-read AGENTS.md and docs/<file>, then redo the last step per the docs."
