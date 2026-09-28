# API spec (base `/api`)

Envelope: `{ success:true, data, message? }` / `{ success:false, error:{ code, message, details? } }`.
Error codes: `VALIDATION_ERROR`(400) `UNAUTHENTICATED`(401) `FORBIDDEN`(403) `NOT_FOUND`(404) `CONFLICT`(409) `RATE_LIMITED`(429) `SERVER_ERROR`(500).
Access: **P**ublic · **A**uth · **O**wner · **AD**min. Pagination query: `page=1&limit=12`.
Serialization: documents expose `id` (not `_id`); populated `owner`/`claimant` expose `{ id, name, department, year, profileImage }` only (plus `email`/`phone` when allowed by privacy rule).

## Health
`GET /health` (P) → `{ status:"ok", uptime }`

## Auth
| Method Path | Access | Body | Returns |
|---|---|---|---|
| POST /auth/register | P | `name, email, password, studentId?, department?, year?` | `{ user, token }` (201). 409 if email exists; 403 if domain not allowed |
| POST /auth/login | P | `email, password` | `{ user, token }`; 401 generic message; 403 `ACCOUNT_SUSPENDED` |
| GET /auth/me | A | – | `{ user }` |
| PATCH /auth/me | A | `name?, department?, year?, phone?, studentId?, profileImage(file)?` | `{ user }` |
| POST /auth/logout | A | – | `{ }` (stateless; client discards token) |

## Items
| Method Path | Access | Notes |
|---|---|---|
| GET /items | P | Query: `search, type, category, location, status, dateFrom, dateTo, owner=me, sort=newest\|oldest, page, limit`. Default `status=ACTIVE`, excludes `isRemoved`. `search` uses `$text` (fallback regex on title). `location` = escaped case-insensitive regex. Date range applies to `date`. Returns paginated `items` (card fields: id,title,type,category,location,date,images[0..],status,owner{name},createdAt). |
| GET /items/:id | P | Full item. Includes `owner` (no contact unless allowed), `claimCount` (owner/admin only), `myClaim` (if authed), `possibleMatches` count (owner only). 404 if removed (except admin/owner). |
| POST /items | A | `multipart/form-data`: `title, description, category, type, location, date, contactPreference, images[]≤5`. Sets `owner=req.user`, `status=ACTIVE`. 201 returns item. Triggers matching after response. |
| PUT /items/:id | O | Same fields, partial. Optional `removeImageIds[]`, new `images[]` (total ≤5). Only when status ACTIVE. |
| PATCH /items/:id/status | O | `{ status: "RESOLVED"\|"CLOSED" }` legal transitions only (409 otherwise). Notifies approved claimant on RESOLVED. |
| DELETE /items/:id | O/AD | Owner: hard delete only if no APPROVED claim (else 409); deletes Cloudinary images, claims, matches. |
| GET /items/:id/claims | O/AD | List claims for the item with claimant public info; contact fields only on APPROVED. |
| POST /items/:id/rematch | O | Re-run matching (rate-limited 5/hour). Returns `{ created: n }`. |

## Claims
| Method Path | Access | Body / Notes |
|---|---|---|
| POST /claims | A | `{ itemId, message, proof }`. 409 if own item, item not ACTIVE, or pending claim exists. Notifies owner `CLAIM_RECEIVED`. |
| GET /claims/my | A | Paginated my claims with item summary and status; on APPROVED includes `contact{ name,email,phone }` of item owner. |
| PATCH /claims/:id | O / claimant | Owner: `{ status:"APPROVED"\|"REJECTED", decisionNote? }`. Claimant: `{ status:"WITHDRAWN" }`. Enforce PENDING-only transitions; approval side effects per backend rules. |

## Matches
| GET /matches/my | A | Suggested matches for my items: `{ id, score, reasoning, matchingAttributes, myItem, otherItem, status }` (other item's contact hidden). |
| PATCH /matches/:id | A (owner of either item) | `{ status:"DISMISSED" }` |

## Notifications
| GET /notifications | A | Paginated, newest first. `?unread=true` filter. |
| GET /notifications/unread-count | A | `{ count }` |
| PATCH /notifications/:id/read | A | marks one read |
| PATCH /notifications/read-all | A | marks all read |

## Reports (abuse)
| POST /reports | A | `{ itemId, reason, details? }` 409 if already reported by user; flags item `isFlagged=true`. |

## AI
| POST /ai/assist | A | `{ text }` (≤600 chars) → `{ suggestedTitle, category, keywords[], likelyLocations[], clarifyingQuestions[] }`. Rate-limited. Fallback: simple keyword→category map when no AI key. |

## Admin (all AD)
| GET /admin/stats | `{ totals:{ users, lost, found, resolved, pendingClaims, openReports }, byCategory[], byLocation[] (top 8), lostVsFound[], reportsPerWeek[] (last 8 weeks), resolutionRate }` |
| GET /admin/users | search, status, page → users (no password) |
| PATCH /admin/users/:id/status | `{ status:"ACTIVE"\|"SUSPENDED" }` (cannot suspend self/last admin) |
| DELETE /admin/users/:id | deletes user + their items/claims/notifications (cannot delete self) |
| GET /admin/items | filters: type,status,isFlagged,isRemoved,search |
| PATCH /admin/items/:id | `{ isFlagged?, isRemoved? }` notifies owner `ITEM_REMOVED` on removal |
| GET /admin/claims | filters: status |
| GET /admin/reports | filters: status |
| PATCH /admin/reports/:id | `{ status, resolutionNote? }` |

## Validation limits (mirror in client forms)
title 3–100 · description 10–1000 · location 2–120 · claim message/proof 10–500 · password ≥8 with letter+number · images ≤5 × 5 MB (jpeg/png/webp) · date not in future.
