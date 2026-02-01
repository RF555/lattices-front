# Lattices Frontend

Hierarchical task management application built with React, TypeScript, and Vite. Organizes todos in a tree structure with drag-and-drop reordering, tagging, filtering, and keyboard navigation.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 6 |
| Routing | React Router 7 |
| Server State | TanStack React Query 5 |
| Client State | Zustand 5 |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS 3 + tailwind-merge |
| i18n | react-i18next + i18next |
| Drag & Drop | dnd-kit |
| Virtualization | @tanstack/react-virtual |
| Testing | Vitest + React Testing Library + MSW |
| Linting | ESLint 9 + Prettier |

## Project Structure

```
src/
├── app/                    # App shell, providers, routing
│   ├── providers/          # AuthProvider, QueryProvider
│   └── routes/             # Route definitions, guards
├── components/             # Shared UI components
│   ├── ui/                 # Atoms: Button, Input, Textarea, Modal, Skeleton, Select...
│   ├── layout/             # MainLayout, PageLoader
│   ├── feedback/           # ConfirmationDialog
│   ├── Toast/              # Toast notification system
│   ├── ErrorBoundary/      # React error boundary
│   └── ColdStartBanner/    # Cold start detection banner
├── features/               # Feature modules
│   ├── auth/               # Authentication (login, register, session)
│   ├── todos/              # Todo CRUD, tree rendering, drag-and-drop
│   └── tags/               # Tag management and filtering
├── hooks/                  # Shared hooks (useAnnounce, useDirection, useFocusTrap, useReducedMotion)
├── i18n/                   # Internationalization
│   ├── i18n.ts             # i18next configuration
│   ├── i18next.d.ts        # Type-safe translation keys
│   └── locales/            # Translation files (en/, he/)
├── lib/                    # Core libraries
│   ├── api/                # HTTP client, query keys, error handling
│   ├── auth/               # Auth provider abstraction (JWT / Supabase)
│   ├── dnd/                # dnd-kit configuration and context
│   └── utils/              # cn(), formatDate utilities
├── stores/                 # Global Zustand stores (toastStore)
├── mocks/                  # MSW handlers for dev/test
├── styles/                 # Global CSS
└── types/                  # Shared TypeScript types
```

Each feature module follows the same structure: `api/`, `components/`, `hooks/`, `pages/`, `stores/`, `types/`, `schemas/`.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |
| `VITE_API_VERSION` | `v1` | API version prefix |
| `VITE_AUTH_PROVIDER` | `supabase` | Auth strategy: `supabase` or `jwt` |
| `VITE_SUPABASE_URL` | — | Supabase project URL (required for Supabase auth) |
| `VITE_SUPABASE_ANON_KEY` | — | Supabase anon key (required for Supabase auth) |
| `VITE_ENABLE_MSW` | `false` | Enable MSW mock API in dev |

### Development

```bash
# Start dev server (port 3000)
pnpm dev

# Start with mock API (no backend needed)
VITE_ENABLE_MSW=true pnpm dev

# Run tests
pnpm test

# Run tests once
pnpm test:run

# Lint
pnpm lint

# Production build
pnpm build

# Preview production build
pnpm preview

# Analyze bundle
ANALYZE=true pnpm build
```

## Architecture

### Routing

React Router 7 with lazy-loaded pages and route guards:

- `/auth/login`, `/auth/register` — Public routes (redirect to `/app` if authenticated)
- `/app` — Protected route (redirect to `/auth/login` if unauthenticated)
- `/` — Redirects to `/app`

### Authentication

Provider-agnostic auth abstraction (`IAuthProvider` interface) with two implementations:

- **Supabase Provider** (default) — Calls Supabase Auth directly from the frontend for login, registration, session management, and token refresh. The Supabase-issued JWT is sent to the FastAPI backend for business logic.
- **JWT Provider** — Legacy token-based auth that calls backend `/auth/*` routes directly.

The API client intercepts 401 responses, refreshes the token, and retries the original request. Concurrent refresh requests are deduplicated.

### State Management

- **Server state**: TanStack React Query with optimistic updates and fuzzy cache invalidation
- **Client state**: Zustand stores with `persist` middleware for localStorage
  - `authStore` — User session, tokens, auth actions
  - `todoUiStore` — Expanded nodes, filters, sort, search
  - `toastStore` — Toast notifications

### Todo Tree

Todos are stored flat on the server and assembled into a tree on the client using an O(n) algorithm. The tree supports:

- Recursive rendering with expand/collapse
- Drag-and-drop reordering (dnd-kit with flat list + CSS indent)
- Virtual scrolling for large lists (@tanstack/react-virtual)
- Keyboard navigation (arrow keys, vim bindings, Home/End)
- Filtering by completion status, tags, and search query
- Sorting by position, creation date, or alphabetical
- Inline detail panel showing editable description, tag picker, and timestamps (created, updated, completed)

### Tags

Color-coded tags for organizing todos. Features inline tag creation, a tag picker with search, tag selection during todo creation, and tag-based filtering in the toolbar.

### Internationalization (i18n)

The app supports English (default) and Hebrew (RTL) using `react-i18next`. Translations are organized by feature namespace (`common`, `auth`, `todos`, `tags`) in `src/i18n/locales/`. The `useDirection` hook sets the document `dir` and `lang` attributes reactively on language change. CSS logical properties (`ps-*`/`pe-*`/`ms-*`/`me-*`/`inset-inline-start`) are used throughout for direction-agnostic layouts. A language switcher (EN/עב) is available in the header and on auth pages. Language preference persists in localStorage.

## Key Patterns

- **Feature-based architecture** following Bulletproof React conventions
- **Flat Fetch, Client Assembly** — API returns flat lists, client builds tree structures
- **Path aliases** — `@features/*`, `@components/*`, `@lib/*`, `@hooks/*`, `@stores/*`, `@i18n/*`
- **Barrel exports** — Each module exposes a clean public API via `index.ts`
- **Optimistic updates** — Mutations update the UI immediately, rolling back on failure

## Deployment

The app is configured for deployment on Render Free Tier with cold start handling. The `ColdStartBanner` component pings the backend health endpoint and shows a loading indicator while the server wakes up.

```bash
# Build for production
pnpm build

# Output: dist/
```
