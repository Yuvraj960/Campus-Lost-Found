# TASKS — build order

Rules: one phase at a time (`/build-phase`). Tick boxes only when verified. Each phase = branch `phase/<n>-<slug>`, merge to `main` after Verify passes.

## Phase 0 — Scaffold & tooling  (branch `phase/0-scaffold`)
Read: AGENTS.md, docs/ARCHITECTURE.md
- [x] `git init`, root `package.json` (workspaces optional) with scripts from AGENTS.md; `concurrently` for `dev`
- [x] `server/`: Express app (`app.js` exports app), `server.js`, `config/env.js` (Zod-validated), `utils/{ApiError,asyncHandler,logger,response}.js`, error + notFound middleware, helmet/cors/morgan/json limit, `GET /api/health`, ESLint config
- [x] `client/`: Vite React app, Tailwind v4 via `@tailwindcss/vite`, react-router, axios, `services/api.js`, ESLint config, Vitest config
- [x] `.env` files created from `.env.example` (do not commit)
- [x] `docs/PROGRESS.md` initialized
Verify: `npm run dev` starts both; `curl localhost:5000/api/health` → ok; client loads; `npm run lint` passes.

## Phase 1 — Frontend shell with mock data  (`phase/1-frontend-shell`)
Read: docs/UI_SPEC.md, docs/API_SPEC.md (response shapes), .agents/rules/20-frontend.md
- [ ] Design tokens, fonts, `components/ui/*`, layouts, Navbar, Sidebar, Footer
- [ ] Mocks + service layer with `VITE_USE_MOCK` flag; `AuthContext` (mock login/register, persisted)
- [ ] Pages: Landing, Login, Register, Dashboard, Lost, Found, ItemDetails, ReportItem (lost/found), MyReports, MyClaims, Matches, Notifications, Profile, NotFound
- [ ] Domain components: ItemCard, SearchBar, FilterPanel, StatusBadge, ImageGallery, ImageUploader, ClaimModal, NotificationBell, MatchCard, EmptyState, Pagination
- [ ] Route guards `ProtectedRoute`, `AdminRoute`
- [ ] Admin pages stubbed with mock stats + charts
Verify: in browser: Landing → Register/Login → Dashboard → Lost list (filter + search + pagination) → Item details → open Claim modal → Report Lost form validation. No console errors; usable at 320px.

## Phase 2 — Backend foundation: models, Item CRUD, seed  (`phase/2-backend-core`)
Read: docs/DATA_MODEL.md, docs/API_SPEC.md (Items), rules/10-backend.md
- [ ] `constants/enums.js` (+ client mirror), all Mongoose models with indexes (User, Item, Claim, Notification, Match, Report)
- [ ] Zod validators, `validate` middleware, pagination + escapeRegex utils
- [ ] Items: list (all filters, `$text`, date range, pagination), get, create, update, status, delete (no auth yet → temporarily accept `x-dev-user` header only when `NODE_ENV=development`, removed in Phase 3)
- [ ] `scripts/seed.js` per DATA_MODEL
Verify: `npm run seed`; curl/REST client: list with each filter, create, update, delete; invalid body → 400 envelope.

## Phase 3 — Authentication & protected routes  (`phase/3-auth`)
Read: docs/API_SPEC.md (Auth), rules/30-security.md
- [ ] Register/login/me/patch me/logout; bcryptjs; JWT; `auth` and `requireRole` middleware; suspended check; auth rate limit; optional email domain restriction
- [ ] Remove dev-user header; protect Item mutations; owner checks in services; privacy stripping of contact fields
- [ ] Client: real auth service, `AuthContext` restores session via `/auth/me`, 401 handling, redirect-back after login; set `VITE_USE_MOCK=false` for auth
Verify: register → login → `/auth/me`; wrong password generic error; protected route 401 without token; suspended user blocked; password never in any response (grep responses).

## Phase 4 — Reporting, search & item details (real API)  (`phase/4-items-ui`)
Read: docs/API_SPEC.md (Items), docs/UI_SPEC.md (Browse, ItemDetails, Report)
- [ ] Wire Lost/Found browse, filters (URL-synced), pagination, ItemDetails, MyReports, Edit, status change, delete to the real API
- [ ] ReportItem submits multipart (images may still be placeholders until Phase 6), field-level server errors, redirect to My Reports
- [ ] Dashboard counts from real data
Verify: create LOST and FOUND items as two users; filters and search work; other user can't edit; cards/details match seed data; mock flag can be `false` for these services.

## Phase 5 — Claims, approvals & notifications  (`phase/5-claims-notifs`)
Read: docs/API_SPEC.md (Claims, Notifications), rules/10-backend.md (status machines)
- [ ] Claim create/list/decision/withdraw with all rules (one pending, not own item, ACTIVE only; approval → item CLAIMED + reject others; reject/withdraw approved → item ACTIVE)
- [ ] `notificationService`; notifications API; polling bell; Notifications page
- [ ] ClaimModal wired; owner claims panel on ItemDetails; MyClaims with ContactCard on approval; mark RESOLVED flow
- [ ] Contact privacy enforced end-to-end
Verify: user B claims user A's item → A gets notification → approve → B sees contact, other pending claims rejected, item CLAIMED; A resolves; illegal transitions return 409; contact hidden before approval (check raw JSON).

## Phase 6 — Image uploads (Cloudinary)  (`phase/6-uploads`)
Read: docs/ARCHITECTURE.md (Upload flow), rules/30-security.md (Uploads)
- [ ] Multer memory upload middleware (type/size/count validation), `imageService` (upload/delete, dev placeholder fallback), cleanup on failure/delete/replace
- [ ] Profile image upload; `ImageUploader` previews; `ImageGallery` on details; lazy images
Verify: upload 1–5 images; 6th rejected; non-image and >5 MB rejected with clear errors; delete item removes Cloudinary assets (or logs in fallback mode).

## Phase 7 — AI matching & assistant  (`phase/7-ai`)
Read: docs/AI_MATCHING.md
- [ ] Gemini client wrapper, matchScorer (AI + heuristic), matchingService, Match model usage, notifications, rematch endpoint, matches API
- [ ] `/ai/assist` + "Help me describe it" button
- [ ] MatchCard on ItemDetails (owner), Dashboard, Matches page; dismiss action
Verify: seeded pair produces a match ≥ threshold and notifies both owners; near-miss pairs don't; works with blank `GEMINI_API_KEY` via heuristic; malformed AI output doesn't break item creation.

## Phase 8 — Admin, abuse reports & analytics  (`phase/8-admin`)
Read: docs/API_SPEC.md (Admin, Reports), docs/UI_SPEC.md (admin routes)
- [ ] Report listing flow (ReportModal → `/reports`), flag item
- [ ] Admin APIs (stats via aggregation pipelines, users, items, claims, reports) + role guard
- [ ] Admin UI: overview charts and management tables with actions, confirm dialogs
Verify: admin sees stats matching DB; suspend user blocks login; remove item hides it publicly and notifies owner; student gets 403 on `/admin/*`.

## Phase 9 — Testing, security, bug fixing  (`phase/9-quality`)
Read: rules/30-security.md, `.agents/workflows/write-tests.md`, `security-audit.md`
- [ ] Backend Jest+Supertest suites (auth, items, claims, notifications, matching, admin) with mocked Cloudinary/Gemini
- [ ] Frontend Vitest+RTL (Login, ReportItem, ItemCard, FilterPanel, ClaimModal, route guards)
- [ ] Run `/security-audit`, fix Critical/High findings; `npm audit`
- [ ] Fix all bugs found; coverage report
Verify: `npm test` green; no Critical/High findings open.

## Phase 10 — Polish, Docker, CI & deployment  (`phase/10-ship`)
Read: `.agents/workflows/ui-audit.md`, `ship.md`
- [ ] `/ui-audit` P0/P1 fixes; a11y pass; favicon/meta tags; 404/500 pages
- [ ] Dockerfiles (client: build → nginx; server: node slim), `docker-compose.yml` (mongo + server + client), `.dockerignore`
- [ ] `.github/workflows/ci.yml`: install, lint, test, build on PR/push
- [ ] README: overview, screenshots, setup, env, scripts, architecture diagram, deploy guide (Atlas + Render/Railway + Vercel/Netlify), demo script and resume blurb
Verify: `docker compose up --build` runs the full app; CI green; full demo flow works from a clean clone.
