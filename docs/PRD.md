# PRD — Campus Lost & Found

## Goal
A web app where university students report **lost** and **found** items, search/filter listings, claim items with proof, and receive notifications and AI-suggested matches. Admins moderate users, items, claims and abuse reports.

## Roles
- **Visitor**: browse Lost/Found lists and item details (reporter contact hidden).
- **Student** (`STUDENT`): everything above + report items, claim items, manage own reports/claims, notifications, matches, profile.
- **Admin** (`ADMIN`): everything + dashboard, user/item/claim/report management, analytics.

## Core user stories
1. As a student I register/login (optionally restricted to a campus email domain).
2. I report a LOST or FOUND item with title, category, description, location, date, up to 5 images, contact preference.
3. I browse and filter items by search text, category, location, date range, type, status; results are paginated.
4. On a FOUND item I click "This might be mine"; on a LOST item I click "I found this". I submit a claim message and proof (something not in the public description).
5. The item owner sees claims, approves or rejects. Approval marks the item CLAIMED, rejects other pending claims, and reveals contact details to both parties.
6. The owner marks the item RESOLVED once handed over, or CLOSED to withdraw it.
7. I get in-app notifications (bell with unread count): new claim, claim approved/rejected, possible match, item removed by admin.
8. When I report an item the system finds possible matches (AI-scored ≥ threshold) and notifies both owners with a score and reasons.
9. "Help me identify my item": I type a messy description and AI suggests category, title, keywords, likely locations.
10. I can report a suspicious listing; admins review reports.
11. Admin dashboard shows totals and charts (lost vs found, by category, by location, resolution rate, reports per week).

## Privacy & trust rules
- Public views never show reporter email/phone. Contact is revealed only to the item owner and the claimant **after** a claim is APPROVED.
- Public descriptions of FOUND items should be general; the claim form tells claimants to describe something not visible in the listing.
- Suspended users cannot log in; removed items are hidden from public lists but visible to admins.

## Out of scope (v1)
Real-time sockets (use 30s polling), email/SMS sending, dark mode, multi-campus tenancy, mobile app, payments, chat between users.

## Success criteria
A new user can register, report an item with images, see it in search, receive a claim, approve it, and see the match/notification flow — on mobile and desktop — with `npm test` green and the app runnable via `docker compose up`.
