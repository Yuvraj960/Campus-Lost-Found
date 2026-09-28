# UI spec

## Design tokens (define in `client/src/index.css` with Tailwind v4 `@theme`)
- Fonts: headings **Plus Jakarta Sans**, body **Inter** (Google Fonts, system fallback).
- Colors: `primary` indigo-600 (hover 700) · `lost` rose-500 · `found` emerald-500 · `match` violet-500 · `warning` amber-500 · neutrals slate (bg slate-50, surface white, border slate-200, text slate-900/600).
- Status badge colors: ACTIVE green · CLAIMED amber · RESOLVED blue · CLOSED slate · PENDING amber · APPROVED green · REJECTED red · WITHDRAWN slate.
- Shape: cards `rounded-2xl border shadow-sm`, inputs/buttons `rounded-xl`, focus ring `ring-2 ring-primary/40`.
- Spacing: 4px scale; page container `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Tone: friendly, student-focused, clean. Not generic-template: use LOST/FOUND color coding consistently, tasteful gradients on hero only, lucide icons.

## Layouts
- `PublicLayout`: Navbar (logo, Lost, Found, Report, Login/Register or user menu + NotificationBell) + Footer.
- `AppLayout`: Navbar + left Sidebar (Dashboard, Report Lost, Report Found, My Reports, My Claims, Matches, Notifications, Profile). Sidebar becomes a slide-over drawer below `lg`.
- `AdminLayout`: Sidebar (Overview, Users, Items, Claims, Reports).

## Routes
| Path | Access | Page | Must include |
|---|---|---|---|
| `/` | public | Landing | hero with search box → `/lost?search=`, Report Lost / Report Found CTAs, live stats strip, how-it-works (3 steps), latest items grid, footer |
| `/login` `/register` | guest only | Login / Register | RHF+Zod forms, show/hide password, server error display, redirect back to intended page |
| `/lost` `/found` | public | Browse | SearchBar, FilterPanel (category, location, date range, status), sort, ItemCard grid, Pagination, empty/loading/error; filters synced to URL query |
| `/items/:id` | public | ItemDetails | ImageGallery, StatusBadge, meta (location/date/category), description, reporter (name, dept), primary action (`This might be mine` on FOUND / `I found this` on LOST) opening ClaimModal, "Report listing" link → ReportModal; owner view: claims list (approve/reject), matches, edit/resolve/close/delete |
| `/dashboard` | auth | Dashboard | greeting, counts (my active reports, pending claims on my items, my claims, unread), Possible matches, recent notifications, quick actions |
| `/report/lost` `/report/found` | auth | ReportItem (one component, `type` prop) | copy differs ("Found something? Help its owner find it."), fields per API_SPEC, ImageUploader (drag/drop, previews, remove, count 0/5), "Help me describe it" AI assist, LocationCombobox with campus suggestions, submit states |
| `/items/:id/edit` | owner | Edit | same form prefilled |
| `/my-reports` | auth | MyReports | tabs All/Lost/Found/Resolved, cards with status + claims count, quick actions |
| `/my-claims` | auth | MyClaims | list with status; on APPROVED show contact card; withdraw pending |
| `/matches` | auth | Matches | MatchCard list |
| `/notifications` | auth | Notifications | unread dot, relative time, mark read/all, click navigates to `link` |
| `/profile` | auth | Profile | edit name/department/year/phone/studentId/photo |
| `/admin` | admin | Overview | stat cards + Recharts: Lost vs Found (bar), By category (pie/donut), By location (horizontal bar), Reports per week (line), resolution rate |
| `/admin/users` `/items` `/claims` `/reports` | admin | Tables | search/filter, pagination, row actions; tables scroll horizontally in a container on mobile |
| `*` | – | NotFound | friendly 404 |

## Components (props summary)
- `ItemCard({ item })` image (aspect-4/3, placeholder), type pill (Lost rose / Found emerald), title (2-line clamp), location + date, StatusBadge.
- `FilterPanel({ values, onChange, onReset })` (drawer on mobile).
- `SearchBar({ value, onChange })` debounced 400ms.
- `ClaimModal({ item, open, onClose, onSubmitted })` with helper text: "Describe something that isn't in the public description."
- `ImageUploader({ files, existing, onChange, max=5 })`.
- `ImageGallery({ images })` main image + thumbnails, keyboard accessible.
- `StatusBadge({ status })`, `EmptyState({ icon, title, description, action })`, `Pagination({ page, totalPages, onChange })`, `Skeleton*`, `Modal`, `ConfirmDialog`, `MatchCard`, `NotificationBell` (unread count, dropdown of latest 5 + "View all"), `StatCard`, `ContactCard`.
- Toasts via react-hot-toast (top-right desktop, top-center mobile).

## Campus location suggestions (`constants/locations.js`)
Library, Cafeteria, Main Gate, Admin Block, Lab Block, Auditorium, Sports Complex, Hostel Block A, Hostel Block B, Parking, Classroom Block, Playground (users may type any).

## Mock data (Phase 1)
`client/src/mocks/{items,users,claims,notifications,matches,stats}.js` with ~16 items, 4 users, 3 claims, 6 notifications, 2 matches, admin stats — shaped exactly like API responses. Use realistic titles and Unsplash-free placeholder images (`https://picsum.photos/seed/<n>/600/400`). Mock service functions simulate latency (300–600 ms) and support filtering/pagination in-memory so every UI state is testable, including an error state via `?mockError=1` or a helper.

## Responsive checklist
320 / 375 / 768 / 1024 / 1440: no horizontal page scroll; nav collapses to hamburger; tables scroll inside container; modals full-screen on <640px; touch targets ≥ 40px; grid columns 1 → 2 → 3 → 4.
