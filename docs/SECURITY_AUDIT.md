# Security Audit Report — Campus Lost & Found

**Audit Date**: 2026-09-28  
**Scope**: Full Stack (Server Express API, MongoDB queries, Client React app, Dependencies)  
**Standard**: `.agents/rules/30-security.md` and OWASP Top 10

---

## 1. Executive Summary
A comprehensive security review was conducted covering authentication, authorization (RBAC/IDOR), cryptographic hygiene, NoSQL/ReDoS injection vectors, input validation, file uploads, privacy safeguards, rate limiting, and dependencies.

Overall posture is robust. Two remediation items were identified regarding rate limit enforcement per `rules/30-security.md`, and dependency vulnerabilities were evaluated via `npm audit`.

---

## 2. Findings Table

| ID | Severity | Location | Description | Exploit Scenario | Recommended Fix | Status |
|---|---|---|---|---|---|---|
| **SEC-01** | **High** | `server/src/app.js` | Missing Global IP Rate Limiter | Malicious actors or scrapers could flood unauthenticated endpoints (`GET /api/items`, `GET /api/health`), causing denial of service. | Implement `globalLimiter` (100 req / 15 min / IP) and mount globally in `app.js`. | **Fixed** |
| **SEC-02** | **Medium** | `server/src/routes/{claim,report,item}Routes.js` | Missing Resource Mutation Rate Limiters | Spammers or bots could submit excessive items, ownership claims, or abuse reports without throttling. | Enforce `mutationLimiter` (20 req / 15 min / IP) on `POST /api/items`, `POST /api/claims`, and `POST /api/reports`. | **Fixed** |
| **SEC-03** | **Low** | Monorepo dependencies (`package.json`) | Transitive dependency warnings in `uuid` and `@vitest/mocker` | Buffer bounds check issue in transitive SDK dependency and path traversal in dev-only test runner mocker. | Safe update via `npm audit fix` where non-breaking. | **Mitigated** |
| **SEC-04** | **Info** | Privacy & PII Handling | Verified contact details protection | Contact email and phone are hidden on all endpoints until an item claim is marked `APPROVED`. | Pass - No action needed. | **Verified** |
| **SEC-05** | **Info** | Password & JWT Hygiene | Verified bcrypt cost 12 and HS256 tokens | Passwords never returned in queries (`select: false`), generic login errors prevent enumeration, suspended users rejected on token reload. | Pass - No action needed. | **Verified** |
| **SEC-06** | **Info** | Query & Input Sanitization | Verified Zod `.strict()` and `escapeRegex` | Mongo queries sanitize user search strings with regex escaping; Zod schemas reject unexpected fields and type coercions. | Pass - No action needed. | **Verified** |

---

## 3. Remediation Details

### SEC-01 & SEC-02: Rate Limiting Enforcement
- Defined `globalLimiter` (100 requests per 15 minutes per IP) in `server/src/middleware/rateLimiter.js`.
- Defined `mutationLimiter` (20 requests per 15 minutes per IP) in `server/src/middleware/rateLimiter.js`.
- Attached `globalLimiter` across the Express application in `server/src/app.js`.
- Attached `mutationLimiter` to:
  - `POST /api/items` (reporting lost/found item)
  - `POST /api/claims` (submitting ownership claim)
  - `POST /api/reports` (filing abuse report)
- All rate limiters bypass in `test` environment to ensure determinism in automated test execution.
