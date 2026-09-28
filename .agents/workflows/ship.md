---
description: Pre-deployment checklist, Docker/CI verification and deployment notes
---
1. Run `npm run lint`, `npm test`, `npm run build`; all must pass.
2. Confirm `.env.example` files are complete and no secrets are tracked (`git ls-files | grep -i env`).
3. Build and run `docker compose up --build`; hit `/api/health` and complete one full flow (register → report → search → claim).
4. Confirm GitHub Actions workflow `.github/workflows/ci.yml` passes locally where possible (`act` optional) and describes lint/test/build jobs.
5. Update README with setup, env vars, scripts, deploy steps (MongoDB Atlas + Render/Railway for server, Vercel/Netlify for client, CORS `CLIENT_URL`, `VITE_API_URL`).
6. Report remaining risks and a go/no-go.
