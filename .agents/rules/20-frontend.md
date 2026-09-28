---
trigger: glob
globs: client/**
description: React/Vite/Tailwind frontend conventions
---
# Frontend rules
## Layout (`client/src/`)
`components/ui/` (Button, Input, Select, Textarea, Modal, Badge, Spinner, EmptyState, Pagination, Skeleton) · `components/` (domain: ItemCard, FilterPanel, SearchBar, ClaimModal, MatchCard, NotificationBell, StatusBadge, ImageGallery, ImageUploader, Navbar, Sidebar) · `layouts/` (PublicLayout, AppLayout, AdminLayout) · `pages/` · `services/` (api.js + one file per resource) · `context/` (AuthContext, NotificationContext) · `hooks/` · `mocks/` · `constants/` · `utils/` · `routes/` (ProtectedRoute, AdminRoute).

## Data access
- Components never call axios directly. Only `services/*` talk to the API through one axios instance in `services/api.js` (baseURL from `VITE_API_URL`, attaches `Authorization: Bearer`, on 401 clears auth and redirects to `/login`).
- Each service function checks `import.meta.env.VITE_USE_MOCK === 'true'` and returns data from `mocks/` shaped **exactly** like docs/API_SPEC.md responses (including the envelope and pagination). Flipping the flag to `false` must need zero component changes.
- Server state: simple `useEffect` + custom hooks (`useItems`, `useDebounce`, `useAsync`). No extra state library.

## UI
- Follow docs/UI_SPEC.md tokens and components exactly; reuse `components/ui/*`, don't restyle per page.
- Mobile-first Tailwind. Every page must render at 320px without horizontal scroll.
- Every data view has: skeleton/loading, empty state (with action), error state (with retry).
- Forms: react-hook-form + zod resolver; inline field errors; disabled + spinner on submit; toast on success/failure; API `error.details` mapped to fields.
- Accessibility: labels for all inputs, `aria-label` on icon buttons, visible focus rings, alt text on images, modals trap focus and close on Esc, sufficient contrast.
- Never use `dangerouslySetInnerHTML`. Render user text as text.
- Images: `loading="lazy"`, fixed aspect ratio containers to avoid layout shift, placeholder icon when none.
- Use `date-fns` for dates; show relative time for notifications, absolute for reports.
