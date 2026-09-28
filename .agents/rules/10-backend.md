---
trigger: glob
globs: server/**
description: Express/Mongoose backend conventions
---
# Backend rules
## Layout (`server/src/`)
`config/` (env, db, cloudinary, gemini) · `constants/` (enums) · `models/` · `validators/` (Zod schemas) · `middleware/` (auth, role, validate, error, rateLimit, upload) · `controllers/` (thin) · `services/` (business logic) · `routes/` · `utils/` (ApiError, asyncHandler, logger, pagination, escapeRegex, response) · `app.js` (express app, exported for tests) · `server.js` (connect DB + listen) · `scripts/seed.js`.

## Layering
- Route → validate middleware → controller → service → model. Controllers only parse req and shape res.
- All business rules (ownership, status transitions, duplicate checks) live in **services**.
- Wrap async handlers with `asyncHandler`. Throw `ApiError(status, code, message, details?)`; one error middleware formats every failure into the standard envelope and maps Mongoose/Zod/Multer/JWT errors.
- Export `app` from `app.js` without listening so Supertest can import it.

## Mongoose
- Enums imported from `constants/enums.js`. Timestamps on. Indexes declared in schema (see docs/DATA_MODEL.md).
- Use `.lean()` for reads that aren't mutated. Never select `password`. Use `select` to limit fields on lists.
- Filtering uses Mongo operators (`$gte`, `$in`, `$regex` with escaped text, `$text`) — never filter in JS after fetching everything.
- Pagination via `utils/pagination.js` (`page`, `limit` default 12, max 50). Always sort with a stable tiebreaker (`createdAt`, `_id`).
- Public item responses must strip reporter `email`/`phone` unless the requester is the owner, an admin, or the claimant of an APPROVED claim.

## Status machines (enforce in services, return 409 on illegal transition)
- Item: `ACTIVE → CLAIMED → RESOLVED`; `ACTIVE|CLAIMED → CLOSED`; approved-claim rejection/withdrawal returns `CLAIMED → ACTIVE`.
- Claim: `PENDING → APPROVED | REJECTED | WITHDRAWN`. Terminal states are final.
- One PENDING claim per (claimant, item). Cannot claim own item. Only ACTIVE items accept claims.
- Approving a claim: item → CLAIMED, all other PENDING claims on the item → REJECTED (notify each).

## Side effects
- Notifications go through `services/notificationService.create()`, which never throws (log and continue).
- AI matching runs after the HTTP response is sent (fire-and-forget with try/catch). It must never fail item creation.
- Cloudinary uploads happen before the DB write; if the DB write fails, delete uploaded images.

## Logging & config
- Read env only in `config/env.js` (validate with Zod at boot; crash early on missing required vars). Use `logger`, not `console`.
