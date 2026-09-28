# PROGRESS LOG
Append newest entry at the bottom: `## YYYY-MM-DD — Phase N — summary`, then bullets: changes, deviations from docs, follow-ups.

## 2026-09-28 — Phase 0 — Scaffold & tooling
- Scaffolded root monorepo with `package.json` and `concurrently` running client and server.
- Built Express 4 server scaffold (`app.js`, `server.js`, `config/env.js` with Zod, error handling, `logger`, `ApiError`, `GET /api/health`, and ESLint/Jest).
- Built Vite + React 18 frontend scaffold with Tailwind CSS v4 (`@tailwindcss/vite`), react-router-dom, `services/api.js`, index shell, and ESLint/Vitest.
- Created `.env` files from `.env.example` in both client and server (gitignored).
- Deviations from docs: Used `@google/genai` version `^0.2.0` on npm (since `0.1.2` is unreleased on registry).
- Follow-ups: Proceed to Phase 1 (`phase/1-frontend-shell`) for mock data, design tokens, and frontend views.

## 2026-09-28 — Phase 1 — Frontend shell with mock data
- Implemented client enums (`enums.js`) and campus location constants (`locations.js`).
- Created mock data layer (`mocks/{users,items,claims,notifications,matches,stats,mockUtils}.js`) simulating network latency and filtering.
- Implemented service layer with `VITE_USE_MOCK` toggle (`auth`, `items`, `claims`, `notifications`, `matches`, `admin`).
- Built persistent `AuthContext` with mock session management and quick demo credentials.
- Built reusable UI primitives: `Button`, `Input`, `Select`, `Textarea`, `Badge`, `Spinner`, `Modal`, `ConfirmDialog`, `EmptyState`, `Pagination`, `Skeleton`, `StatCard`, `ContactCard`.
- Built domain components: `ItemCard`, `SearchBar` (400ms debounced), `FilterPanel`, `StatusBadge`, `ImageGallery`, `ImageUploader`, `ClaimModal`, `NotificationBell`, `MatchCard`.
- Created layouts: `PublicLayout`, `AppLayout` (with responsive drawer sidebar), and `AdminLayout`.
- Implemented route guards: `ProtectedRoute`, `AdminRoute`, `GuestRoute`.
- Implemented all pages: Landing, Login, Register, BrowseItems (`/lost`, `/found`), ItemDetails, Dashboard, ReportItem, EditItem, MyReports, MyClaims, Matches, Notifications, Profile, NotFound, and Admin dashboard views with Recharts.
- Verified acceptance flows in browser and captured screenshots at desktop and mobile widths.
- Deviations from docs: None.
- Follow-ups: Proceed to Phase 2 (`phase/2-backend-core`) for Mongoose models, Item CRUD, and DB seed script.
