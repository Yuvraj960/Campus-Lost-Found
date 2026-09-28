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

## 2026-09-28 — Phase 2 — Backend foundation: models, Item CRUD, seed
- Implemented `server/src/constants/enums.js` reflecting all PRD/DATA_MODEL enums.
- Created all 6 Mongoose models (`User`, `Item`, `Claim`, `Notification`, `Match`, `Report`) with exact schema requirements, indexes (text index, compound indexes, unique partial indexes), and sensitive field protections.
- Implemented utility helpers: `escapeRegex.js` for ReDoS/injection-safe queries, `pagination.js` for limit/offset handling.
- Implemented Zod schemas for Items in `validators/itemValidators.js` and validation middleware `middleware/validate.js`.
- Implemented `itemService.js` and `itemController.js` supporting list with search/filtering, get item with contact privacy protection, create, update, status change with 409 conflict validation, and delete with approved claim check.
- Added temporary dev user injector `middleware/devUser.js` for development/testing prior to Phase 3 auth.
- Implemented comprehensive `scripts/seed.js` creating 1 admin, 5 students, 25 items across campus locations (with 3 matching pairs and 2 near-misses), claims, notifications, matches, and reports. Enhanced with automatic in-memory MongoDB fallback when local Mongo service is not running.
- Created 16 integration tests in `server/tests/items.test.js` validating all CRUD operations, filtering, status transitions, and privacy filtering.
- Deviations from docs: Enhanced seed script to automatically start an in-memory MongoDB instance if local MongoDB connection is refused (`ECONNREFUSED`), allowing seed verification in any environment without requiring an external daemon.
- Follow-ups: Proceed to Phase 3 (`phase/3-auth`) for JWT auth, password hashing, route protection, and removing the temporary dev user injector.

## 2026-09-28 — Phase 3 — Authentication & protected routes
- Implemented Zod validation schemas for auth in `server/src/validators/authValidators.js` (`registerSchema` with password strength requirement ≥8 chars with letter and number, `loginSchema`, `updateMeSchema`).
- Implemented JWT utility `server/src/utils/jwt.js` (HS256, 7d expiration, payload with `sub` and `role` only).
- Implemented IP rate limiter `server/src/middleware/rateLimiter.js` capping auth requests to 10 requests per 15 minutes per IP.
- Implemented auth middlewares in `server/src/middleware/auth.js` (`auth` validating Bearer token, loading user, rejecting missing or suspended users; `optionalAuth` attaching user if valid token present) and `requireRole.js` for RBAC checks.
- Implemented auth service and controller (`server/src/services/authService.js`, `server/src/controllers/authController.js`, `server/src/routes/authRoutes.js`) with `/register` (201), `/login` (200), `/me` (200), `/me` PATCH (200), and `/logout` (200). Added domain restriction logic with `ALLOWED_EMAIL_DOMAIN`.
- Removed temporary `devUserMiddleware` and protected Item mutation routes (`POST`, `PUT`, `PATCH /status`, `DELETE`) with `auth`. Mounted `optionalAuth` on item reads to reveal owner contact info when allowed.
- Updated client `authService.js` to call the real backend API by default.
- Added comprehensive integration tests in `server/tests/auth.test.js` (16 tests) verifying registration, login, suspended account blockage, generic 401 error message without user enumeration, session restoration, and verified zero password leakage across all responses. Updated `server/tests/items.test.js` to use real JWT tokens.
- Deviations from docs: None.
- Follow-ups: Proceed to Phase 4 (`phase/4-items-ui`) for wiring Browse, ItemDetails, MyReports, and Report forms to the real API.

## 2026-09-28 — Phase 4 — Reporting, search & item details (real API)
- Implemented multer memory storage upload middleware `server/src/middleware/upload.js` (`uploadItemImages` and `processItemImages`) validating image file types (JPEG, PNG, WebP), 5MB size limit, and max 5 files.
- Mounted image upload middleware on `POST /api/items` and `PUT /api/items/:id` in `server/src/routes/itemRoutes.js`.
- Enhanced `itemService.getItems` to support `owner=me` query with authentication enforcement (rejects unauthenticated requests with 401).
- Wired `client/src/services/itemService.js` directly to real backend API by default.
- Enhanced `ReportItem.jsx` to map field-level server validation errors (`err.details`) into React Hook Form errors and successfully redirect to `/my-reports`.
- Updated `MyReports.jsx` to fetch all statuses on tab ALL and connect real items to the user view.
- Verified live Browse, Search, ItemDetails, and Landing views with real database listings seeded in MongoDB. Captured desktop and mobile screenshots (`browse_lost_real_desktop.png`, `browse_lost_real_mobile.png`, `landing_real_desktop.png`).
- Added automated integration tests for `owner=me` queries and multipart image uploads.
- Deviations from docs: None.
- Follow-ups: Proceed to Phase 5 (`phase/5-claims-notifs`) for claims creation/approval state machine and notifications.

## 2026-09-28 — Phase 5 — Claims, approvals & notifications
- Implemented `notificationService.js` with fail-safe creation (never crashes callers), paginated list, unread count, single read, and mark-all-read operations.
- Implemented `notificationController.js` and `notificationRoutes.js` (`/api/notifications/*`).
- Implemented Zod schemas in `validators/claimValidators.js` (`createClaimSchema`, `updateClaimStatusSchema`).
- Implemented `claimService.js` with strict state machine rules:
  - Validates item is `ACTIVE`, prevents self-claims (409), prevents duplicate pending claims per (item, claimant) (409).
  - Approving a claim transitions item to `CLAIMED`, rejects all other pending claims on the item, and notifies each claimant.
  - Exposes owner contact details (`name`, `email`, `phone`) on `GET /api/claims/my` only when claim is `APPROVED` (hidden before approval).
  - Enforces PENDING-only transitions and terminal state immutability.
- Updated `itemService.updateItemStatus` to notify approved claimants when an item transitions to `RESOLVED`.
- Mounted `/api/claims` and `/api/notifications` in `server/src/app.js`.
- Switched client `claimService.js` and `notificationService.js` to real API by default.
- Created comprehensive integration test suites: `claims.test.js` (6 tests) and `notifications.test.js` (3 tests). Monorepo test suite now at 45 passing tests.
- Deviations from docs: None.
- Follow-ups: Proceed to Phase 6 (`phase/6-uploads`) for Cloudinary image uploads and delete cleanup.

## 2026-09-28 — Phase 6 — Image uploads (Cloudinary)
- Configured Cloudinary v2 SDK in `server/src/config/cloudinary.js` with fallback detection (`isCloudinaryConfigured`) and structured logging.
- Implemented `server/src/services/imageService.js` (`uploadOne`, `uploadMany`, `delete`, `deleteMany`):
  - Streams memory buffers to Cloudinary via `upload_stream`.
  - In development/test or when credentials are not configured, falls back to deterministic placeholder URLs (`picsum.photos`) without crashing requests.
  - Implements rollback cleanup in `uploadMany` if an upload fails midway through a batch.
- Configured `multer` memory storage upload middleware in `server/src/middleware/upload.js` (`uploadItemImages`, `uploadProfileImage`, `processItemImages`, `processProfileImage`):
  - Enforces strict JPEG, PNG, and WebP MIME validation.
  - Enforces 5 MB per file size limit.
  - Enforces max 5 images per item.
  - Standardized error handling in `server/src/middleware/error.js` mapping `LIMIT_FILE_SIZE` and `LIMIT_UNEXPECTED_FILE` / `LIMIT_FILE_COUNT` to standard 400 `VALIDATION_ERROR` envelopes.
- Mounted profile image upload middleware on `PATCH /api/auth/me` with Zod schema support for both object and string URLs. Updated `authService.updateMe` to automatically clean up previously attached Cloudinary avatars when a user updates their photo.
- Integrated Cloudinary asset deletion in `itemService.deleteItem` (cleans up all associated image publicIds) and `itemService.updateItem` (supports `removeImageIds` to delete replaced images).
- Updated frontend client:
  - Added avatar photo upload action to `Profile.jsx` using `FormData` and `useAuth().updateUser`.
  - Added `loading="lazy"` attribute to main and thumbnail images in `ImageGallery.jsx`.
  - Updated `authService.updateMe` to support multipart/form-data payloads.
- Added comprehensive integration test suite `server/tests/uploads.test.js` (7 tests) validating 1–5 files accepted, 6th file rejected (400 `VALIDATION_ERROR`), non-image formats rejected, >5MB files rejected, item deletion removes Cloudinary assets, and profile avatar upload via `PATCH /api/auth/me`.
- Full monorepo test suite now passes with 53 tests (52 server + 1 client).
- Deviations from docs: None.
- Follow-ups: Proceed to Phase 7 (`phase/7-ai`) for AI matching, heuristic scorer, and assistant endpoint.
