# AGENTS.md — Campus Lost & Found

MERN web app: students report lost/found items, search & filter, claim items, get notifications and AI-suggested matches. Admins moderate.
This file is the canonical rulebook. Detail lives in `.agents/rules/*` and `docs/*`.

## Source of truth (read before coding)
| Need | File |
|---|---|
| Scope, roles, user stories | docs/PRD.md |
| Layers, folders, env vars, flows | docs/ARCHITECTURE.md |
| Schemas, enums, indexes, seed data | docs/DATA_MODEL.md |
| Every endpoint (request/response) | docs/API_SPEC.md |
| Routes, pages, components, design tokens | docs/UI_SPEC.md |
| AI matching + AI assist | docs/AI_MATCHING.md |
| Build order + acceptance checks | docs/TASKS.md |
| What is done so far | docs/PROGRESS.md |

If code and docs disagree, the docs win. If a doc is wrong or incomplete, fix the doc in the same change and mention it in the report.

## Session protocol (every task)
1. Read `docs/TASKS.md` and `docs/PROGRESS.md` to find the current phase.
2. Read only the docs that phase lists under **Read**.
3. Plan briefly (files to touch, order). Do not start coding a plan that contradicts the docs; ask instead.
4. Implement in small, reviewable steps. One concern per commit.
5. Run the phase **Verify** commands. Fix failures. If the same error persists after 3 attempts, stop and report the exact error.
6. Tick boxes in `docs/TASKS.md`, append an entry to `docs/PROGRESS.md`, commit.
7. Stop after the requested phase(s). Never begin the next phase unasked.

## Stack (fixed — do not swap or add libraries without saying why)
- Monorepo: `client/` (React SPA) + `server/` (Express API). Root `package.json` runs both with `concurrently`.
- Language: JavaScript, ES modules everywhere (`"type": "module"`). Node 20+.
- Server: Express 4, Mongoose 8, Zod, jsonwebtoken, bcryptjs, multer (memory storage), cloudinary, helmet, cors, express-rate-limit, morgan, dotenv, @google/genai.
- Server dev/test: nodemon, Jest, Supertest, mongodb-memory-server, ESLint.
- Client: React 18+, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), react-router-dom, axios, react-hook-form + @hookform/resolvers + zod, lucide-react, recharts, react-hot-toast, date-fns.
- Client test: Vitest + React Testing Library.
- DB: MongoDB (local or Atlas) via Mongoose. AI: Google Gemini via `@google/genai` (model from env, never hard-coded).

## Root commands (create these in Phase 0; keep them working)
`npm run dev` (client+server) · `npm run dev:client` · `npm run dev:server` · `npm run build` · `npm run lint` · `npm test` · `npm run seed`

## Conventions
- API base `/api`. JSON envelope: success `{ success:true, data, message? }`; failure `{ success:false, error:{ code, message, details? } }`.
- Lists are paginated: `data = { items, page, limit, total, totalPages }`.
- Enums are UPPER_SNAKE strings, defined once in `server/src/constants/enums.js` and mirrored in `client/src/constants/enums.js`.
- Files: components `PascalCase.jsx`; everything else `camelCase.js`. Named exports except React pages/components (default).
- No `console.log` in committed code on the server; use `utils/logger.js`.
- No dead code, no TODO left without a matching item in TASKS.md.
- Comments explain *why*, not *what*.

## Hard rules
1. Never commit secrets. `.env` is git-ignored; keep `.env.example` files current.
2. Never return `password` (or hashes/tokens) in any response. Schema uses `select:false`.
3. Every mutating or private endpoint is behind `auth`; ownership/role checks live in services, not only routes.
4. Validate every request body/query/params with Zod on the server. Client validation is UX only.
5. Never build Mongo queries from raw user objects. Escape user text before using in `$regex`.
6. AI/Cloudinary/Gemini keys stay on the server. The client never calls them.
7. External services (Gemini, Cloudinary) must be mockable and must never crash a request when they fail.
8. Do not modify unrelated modules while implementing a feature.
9. Ask before: deleting files you didn't create, running destructive DB/shell commands, adding dependencies not in the Stack list.
10. Contact details (email/phone) of a reporter are hidden until a claim on that item is APPROVED (see PRD privacy section).

## Definition of done (per task)
- Matches docs (endpoints, shapes, routes, tokens).
- Loading, empty, error and validation states exist for every UI you touch.
- Layout works at 320, 375, 768, 1024, 1440 px.
- Lint passes; relevant tests pass; new logic has tests once Phase 9 test harness exists.
- Docs/TASKS/PROGRESS updated. Committed with a conventional message.

## Final report format (end every task with this)
**Built** (bullets) · **Run it** (commands) · **Check manually** (2–5 steps) · **Deviations from docs** · **Next phase**
