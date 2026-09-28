# Architecture

```
React SPA (Vite)  --HTTPS JSON-->  Express API  --Mongoose-->  MongoDB
                                     |-- Cloudinary (images, server-side upload)
                                     |-- Gemini API (matching, assistant; server-side only)
```

## Repo layout
```
campus-lost-found/
├── AGENTS.md  GEMINI.md  README.md  .gitignore
├── .agents/rules|workflows
├── docs/
├── package.json            # root scripts (concurrently)
├── docker-compose.yml      # Phase 10
├── .github/workflows/ci.yml# Phase 10
├── client/
│   ├── index.html  vite.config.js  package.json  .env.example
│   └── src/ (main.jsx App.jsx index.css components/ layouts/ pages/ services/ context/ hooks/ mocks/ constants/ utils/ routes/)
└── server/
    ├── package.json  .env.example
    └── src/ (app.js server.js config/ constants/ models/ validators/ middleware/ controllers/ services/ routes/ utils/ scripts/seed.js)
    └── tests/
```

## Request lifecycle
`route → rateLimit → auth? → role? → validate(Zod) → controller → service → model → response envelope`. Errors bubble to one error middleware.

## Auth flow
Register/login return `{ user, token }`. Client stores token in localStorage and `AuthContext`; axios interceptor sends `Authorization: Bearer <token>`. `GET /auth/me` restores session on load. 401 → clear & redirect to `/login`.

## Upload flow
Client sends `multipart/form-data` (`images[]`) to `POST /items` (and `PUT /items/:id`). Multer (memory, ≤5 files, ≤5 MB, jpeg/png/webp) → `imageService.uploadMany()` streams to Cloudinary folder `campus-lost-found/items` → store `{ url, publicId }` in Mongo. On delete/replace, remove from Cloudinary. If Cloudinary env is missing in development, `imageService` returns placeholder URLs and logs a warning so the flow still works.

## Notification flow
Services call `notificationService.create({ recipient, type, message, item?, link })`. Client polls `GET /notifications/unread-count` every 30s (only when tab visible) and loads the list on open.

## Matching flow
`POST /items` → respond 201 → `matchingService.runForItem(itemId)` (async, try/catch) → candidates → Gemini (or heuristic fallback) → create `Match` docs ≥ threshold → notify both owners. See docs/AI_MATCHING.md.

## Environment variables
Server: see `server/.env.example`. Client: `VITE_API_URL`, `VITE_USE_MOCK`.

## Key decisions
| Decision | Why |
|---|---|
| JS + ESM, no TypeScript | Faster vibe-coding, less config; Zod gives runtime safety |
| bcryptjs over bcrypt | No native build issues on Windows |
| Express 4 | Stable ecosystem for middleware used here |
| Polling for notifications | Simpler than sockets; sockets are a stretch goal |
| Mock flag in client services | UI can be built before the API exists, swap with one env var |
| Fire-and-forget matching | Item creation stays fast and reliable |
| Fallback heuristic matcher | App works without an AI key and in tests |
