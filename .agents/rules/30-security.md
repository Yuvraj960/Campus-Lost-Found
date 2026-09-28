---
trigger: always_on
description: Security requirements applied to all code
---
# Security rules
- Passwords: bcryptjs, cost 12, min length 8 with letter+number. Generic login error ("Invalid email or password") — no user enumeration.
- JWT: HS256, secret from env (≥32 chars in prod), 7d expiry, payload `{ sub, role }` only. Auth middleware re-loads the user and rejects SUSPENDED/missing users.
- Authorization: every route declares its access (public / auth / owner / admin) in docs/API_SPEC.md; enforce owner checks in services. Return 404 (not 403) for other users' private resources where existence should be hidden.
- Input: Zod `.strict()` schemas; coerce types; cap string lengths (title 100, description 1000, message 500); cap arrays. Reject any object where a string is expected (blocks NoSQL operator injection like `{"$gt":""}`).
- Regex: always `escapeRegex()` user text before `$regex`.
- Uploads: allow only jpeg/png/webp, ≤5 MB each, ≤5 files; check MIME and magic bytes if available; never trust filename; memory storage only; delete from Cloudinary when item deleted.
- HTTP: `helmet`, CORS limited to `CLIENT_URL`, `express.json({ limit: '100kb' })`, disable `x-powered-by`.
- Rate limits: global 100 req/15min/IP; auth routes 10/15min; claim/report/ai routes 20/15min per user/IP.
- Errors: never leak stack traces or Mongo error text in production responses.
- Privacy: reporter email/phone hidden until approved claim; users can only see their own claims/notifications; admin endpoints require `role === 'ADMIN'`.
- Client: token in localStorage is accepted for v1 (documented trade-off); never render raw HTML; validate/normalize external URLs (images from Cloudinary only).
- Secrets: never log tokens, passwords, API keys or full request bodies of auth routes.
