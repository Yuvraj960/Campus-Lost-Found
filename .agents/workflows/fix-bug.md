---
description: Diagnose and fix a bug from an error message or description with a regression test
---
Usage: `/fix-bug <paste exact error / steps to reproduce>`.

1. Reproduce: run the failing command or walk the flow in the browser. Capture the exact error.
2. Find the root cause (read the relevant code and docs; do not guess or patch symptoms).
3. Explain the cause in 2–3 sentences before changing code.
4. Write a failing test if a test harness exists; otherwise note the manual repro steps.
5. Apply the smallest fix. Do not change unrelated code.
6. Re-run the repro, the new test, lint and the whole test suite.
7. Commit as `fix(<area>): ...` and report cause, fix, and how it was verified.
