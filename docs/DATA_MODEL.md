# Data model (Mongoose)

All models: `timestamps: true`. IDs are ObjectIds (serialized as strings, field `id` via `toJSON` transform; remove `__v`).

## Enums (`constants/enums.js`)
```
ROLE:            STUDENT | ADMIN
USER_STATUS:     ACTIVE | SUSPENDED
ITEM_TYPE:       LOST | FOUND
ITEM_STATUS:     ACTIVE | CLAIMED | RESOLVED | CLOSED
CATEGORY:        ELECTRONICS | WALLET_BAGS | KEYS | ID_DOCUMENTS | CLOTHING | BOOKS_STATIONERY | ACCESSORIES | SPORTS | OTHER
CONTACT_PREF:    EMAIL | IN_APP
CLAIM_STATUS:    PENDING | APPROVED | REJECTED | WITHDRAWN
MATCH_STATUS:    SUGGESTED | DISMISSED | CONFIRMED
NOTIF_TYPE:      CLAIM_RECEIVED | CLAIM_APPROVED | CLAIM_REJECTED | CLAIM_WITHDRAWN | MATCH_FOUND | ITEM_RESOLVED | ITEM_REMOVED | REPORT_UPDATE | WELCOME
REPORT_REASON:   FAKE_LISTING | SPAM | INAPPROPRIATE | WRONG_INFO | OTHER
REPORT_STATUS:   PENDING | REVIEWING | RESOLVED | DISMISSED
```

## User
| field | type | notes |
|---|---|---|
| name | String | required, 2–60 |
| email | String | required, unique, lowercase, indexed |
| password | String | required, `select:false`, bcrypt hash |
| studentId | String | optional, unique-sparse |
| department | String | optional |
| year | Number | 1–6 optional |
| phone | String | optional, private (revealed only after approved claim) |
| profileImage | `{url, publicId}` | optional |
| role | ROLE | default STUDENT |
| status | USER_STATUS | default ACTIVE |
Methods: `comparePassword()`. Pre-save hash if modified. `toJSON` strips password.

## Item
| field | type | notes |
|---|---|---|
| title | String | required 3–100 |
| description | String | required 10–1000 |
| category | CATEGORY | required, indexed |
| type | ITEM_TYPE | required, indexed |
| location | String | required 2–120 (free text; UI suggests campus places) |
| date | Date | required, not in future; when lost/found |
| images | [{url, publicId}] | max 5 |
| status | ITEM_STATUS | default ACTIVE, indexed |
| owner | ObjectId→User | required, indexed |
| contactPreference | CONTACT_PREF | default IN_APP |
| isFlagged | Boolean | default false |
| isRemoved | Boolean | default false (admin soft-remove) |
| resolvedAt | Date | set on RESOLVED |
Indexes: text index on `title, description, location`; compound `{type:1,status:1,createdAt:-1}`; `{category:1,date:-1}`; `{owner:1,createdAt:-1}`.

## Claim
| field | type | notes |
|---|---|---|
| item | ObjectId→Item | required, indexed |
| claimant | ObjectId→User | required, indexed |
| message | String | required 10–500 (why it's mine / where I found it) |
| proof | String | required 10–500 (detail not in public description) |
| status | CLAIM_STATUS | default PENDING |
| decidedAt | Date | |
| decisionNote | String | optional ≤300 |
Unique partial index: `{item, claimant}` where `status = PENDING`.

## Notification
`recipient` (User, indexed) · `type` NOTIF_TYPE · `message` String ≤200 · `item` (Item, optional) · `link` String (client route) · `read` Boolean default false · index `{recipient:1, read:1, createdAt:-1}`. TTL optional (90 days).

## Match
`lostItem` (Item) · `foundItem` (Item) · `score` Number 0–100 · `reasoning` String · `matchingAttributes` [String] · `source` `GEMINI|HEURISTIC` · `status` MATCH_STATUS default SUGGESTED. Unique index `{lostItem, foundItem}`.

## Report (abuse report)
`item` (Item) · `reporter` (User) · `reason` REPORT_REASON · `details` String ≤500 · `status` REPORT_STATUS default PENDING · `resolvedBy` (User) · `resolutionNote` String. Unique `{item, reporter}`.

## Seed data (`npm run seed`, idempotent: wipe seeded collections then insert)
- 1 admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- 5 students, password `Password123!`, plausible names/departments/years.
- ~25 items across all categories and campus places (Library, Cafeteria, Hostel Block A/B, Admin Block, Lab Block, Sports Complex, Auditorium, Main Gate, Parking), dates within last 30 days, mixed statuses. Use placeholder image URLs (e.g. `https://picsum.photos/seed/<n>/600/400`) when Cloudinary isn't configured.
- **3 deliberate LOST/FOUND pairs that should match** (e.g. black Samsung phone with cracked corner @ Library; blue water bottle @ Sports Complex; keychain with 3 keys @ Cafeteria) plus 2 near-miss pairs that should score below threshold.
- 4 claims (PENDING/APPROVED/REJECTED), 6 notifications, 2 abuse reports, 2 matches.
- Print login credentials at the end of the seed run.
