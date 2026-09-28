---
description: Write or extend backend (Jest+Supertest) and frontend (Vitest+RTL) tests for a named area
---
Usage: `/write-tests <area>` e.g. `auth`, `items`, `claims`, `matching`, `all`.

1. Read the relevant service, controller and `docs/API_SPEC.md`.
2. Backend: Jest + Supertest with mongodb-memory-server; mock Cloudinary and Gemini modules. Cover happy paths, validation errors (400), unauthenticated (401), forbidden (403), not found (404), illegal state transitions (409), and privacy (contact hidden until approved claim).
3. Frontend (if the area has UI): Vitest + React Testing Library for forms, ItemCard, FilterPanel, ClaimModal, route guards. Mock `services/*`.
4. Run the suites, report pass/fail counts and coverage for the area. Fix bugs you find in the code (as separate `fix:` commits) rather than weakening tests.
