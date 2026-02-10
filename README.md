# Lattices Frontend

Hierarchical task management application built with React, TypeScript, and Vite. Organizes todos in a tree structure with tagging, filtering, and keyboard navigation.

## Tech Stack

| Category       | Technology                              |
| -------------- | --------------------------------------- |
| Framework      | React 18 + TypeScript (strict)          |
| Build          | Vite 6                                  |
| Routing        | React Router 7                          |
| Server State   | TanStack React Query 5                  |
| Client State   | Zustand 5                               |
| Forms          | React Hook Form + Zod                   |
| Styling        | Tailwind CSS 3 + tailwind-merge         |
| i18n           | react-i18next + i18next                 |
| Virtualization | @tanstack/react-virtual                 |
| Bottom Sheets  | vaul                                    |
| Swipe Gestures | react-swipeable                         |
| PWA            | vite-plugin-pwa + Workbox               |
| Offline        | @tanstack/react-query-persist-client    |
| Testing        | Vitest + React Testing Library + MSW    |
| Linting        | ESLint 9 (strictTypeChecked) + Prettier |
| Accessibility  | eslint-plugin-jsx-a11y                  |
| Git Hooks      | Husky + lint-staged                     |
| CI             | GitHub Actions                          |

## Project Structure

```
src/
├── app/                    # App shell, providers, routing
│   ├── providers/          # AuthProvider, QueryProvider
│   └── routes/             # Route definitions, guards
├── constants/              # Centralized typed constants (timing, z-index, breakpoints, keys)
├── components/             # Shared UI components
│   ├── ui/                 # Atoms: Button, Input, Modal, Skeleton, BottomSheet, FAB...
│   ├── layout/             # MainLayout, PageLoader, BottomNav, SettingsSheet, WorkspaceSheet
│   ├── feedback/           # ConfirmationDialog
│   ├── Toast/              # Toast notification system
│   ├── ErrorBoundary/      # React error boundary
│   ├── ColdStartBanner/    # Cold start detection banner
│   ├── ReloadPrompt/       # PWA service worker update prompt
│   └── OfflineIndicator/   # Network status banner
├── features/               # Feature modules
│   ├── auth/               # Authentication (login, register, session)
│   ├── todos/              # Todo CRUD, tree rendering
│   ├── tags/               # Tag management and filtering
│   ├── workspaces/         # Multi-user workspaces, members, invitations, groups, activity
│   └── notifications/      # In-app notifications and preferences
├── hooks/                  # Shared hooks (useIsMobile, useDirection, useFocusTrap...)
├── i18n/                   # Internationalization
│   ├── i18n.ts             # i18next configuration
│   ├── i18next.d.ts        # Type-safe translation keys
│   └── locales/            # Translation files (en/, he/)
├── lib/                    # Core libraries
│   ├── api/                # HTTP client, query keys, error handling
│   ├── auth/               # Auth provider abstraction (JWT / Supabase)
│   ├── realtime/           # Supabase Realtime manager (workspace, presence, notifications)
│   └── utils/              # cn(), formatDate utilities
├── stores/                 # Global Zustand stores (toastStore, mobileNavStore)
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

| Variable                 | Default                 | Description                                       |
| ------------------------ | ----------------------- | ------------------------------------------------- |
| `VITE_API_URL`           | `http://localhost:8000` | Backend API URL                                   |
| `VITE_API_VERSION`       | `v1`                    | API version prefix                                |
| `VITE_AUTH_PROVIDER`     | `supabase`              | Auth strategy: `supabase` or `jwt`                |
| `VITE_SUPABASE_URL`      | —                       | Supabase project URL (required for Supabase auth) |
| `VITE_SUPABASE_ANON_KEY` | —                       | Supabase anon key (required for Supabase auth)    |
| `VITE_ENABLE_MSW`        | `false`                 | Enable MSW mock API in dev                        |

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
pnpm lint:fix        # auto-fix

# Format
pnpm format          # write
pnpm format:check    # check only

# Type check
pnpm type-check

# Full quality pipeline (format + lint + type-check + tests)
pnpm quality

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
- `/invite` — Accept workspace invitation (public, token-based)
- `/app` — Protected dashboard (redirect to `/auth/login` if unauthenticated)
- `/app/workspaces/:id/settings` — Workspace settings (Admin+)
- `/app/workspaces/:id/members` — Member management
- `/app/workspaces/:id/activity` — Workspace activity feed
- `/app/workspaces/:id/groups` — User groups
- `/app/workspaces/:id/groups/:groupId` — Group detail
- `/app/notifications` — Notifications page (mobile-first, also accessible on desktop)
- `/app/settings/notifications` — Notification preferences
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
  - `workspaceUiStore` — Active workspace ID, sidebar state
  - `notificationUiStore` — Panel open/close, filter (all/unread), toast preference (persisted)
  - `toastStore` — Toast notifications
  - `mobileNavStore` — Bottom nav sheet states (non-persisted)

### Todo Tree

Todos are stored flat on the server and assembled into a tree on the client using an O(n) algorithm. The tree supports:

- Recursive rendering with expand/collapse
- Virtual scrolling for large lists (@tanstack/react-virtual, threshold-based activation at 50+ items)
- Keyboard navigation (arrow keys, vim bindings, Home/End)
- Filtering by completion status, tags, and search query
- Sorting by position, creation date, date updated, or alphabetical
- Detail panel (desktop: inline panel, mobile: bottom sheet via vaul)
- Swipe-to-reveal actions on mobile (swipe left to delete, swipe right to complete, full-swipe auto-trigger at 50%, RTL-aware)

### Tags

Color-coded tags for organizing todos. Features inline tag creation, a tag picker with search, tag selection during todo creation, and tag-based filtering in the toolbar.

### Workspaces

Multi-user collaboration through workspaces. Each workspace scopes todos, tags, and activity. Features:

- **Workspace switching** — Header dropdown to switch between workspaces with role badges (Owner/Admin/Member/Viewer)
- **Member management** — Invite members by email, assign roles, transfer ownership, remove members
- **Invitations** — Email-based invitations with accept/revoke flow and pending invitation banner
- **Activity feed** — Timeline of workspace actions (todo CRUD, member changes) with actor info and timestamps
- **User groups** — Organize workspace members into groups with group-level management
- **Permission system** — Role-based access control (Owner > Admin > Member > Viewer) via `useWorkspacePermission` hook
- **Real-time collaboration** — Supabase Realtime for live updates, online presence indicators, "someone is viewing" indicators, and conflict notifications
- **Workspace sidebar** — Collapsible navigation for workspace sections (Todos, Tags, Members, Activity, Groups, Settings)

### Notifications

In-app notification center for workspace events (task changes, member updates, invitation actions) with real-time delivery via Supabase Realtime:

- **Notification bell** — Header icon with unread count badge (99+ cap), keyboard shortcut (`N` to toggle)
- **Notification panel** — Dropdown with All/Unread filter tabs, cursor-based pagination, click-through navigation to entity, mark as read/unread, dismiss, and "mark all as read". Mobile-responsive (full-screen overlay on small screens, dropdown on desktop)
- **Notification preferences** — Category-based layout (Task, Workspace, Invitation, Group) with per-type toggle switches. Mandatory notification types (member changes, invitations) are always-on. Configurable toast preference for new notifications
- **Real-time delivery** — Supabase Realtime Postgres Changes on `notification_recipients` table with instant unread count update, lazy list refetch, and optional toast notification. Realtime-first strategy: no polling when connected, 30s fallback polling on connection error, refetch on tab focus, full query invalidation on reconnect
- **Entity navigation** — Clicking a notification navigates to the relevant entity (todo, workspace settings, group) and selects the item in the UI

### Internationalization (i18n)

The app supports English (default) and Hebrew (RTL) using `react-i18next`. Translations are organized by feature namespace (`common`, `auth`, `todos`, `tags`, `notifications`) in `src/i18n/locales/`. The `useDirection` hook sets the document `dir` and `lang` attributes reactively on language change. CSS logical properties (`ps-*`/`pe-*`/`ms-*`/`me-*`/`inset-inline-start`) are used throughout for direction-agnostic layouts. A language switcher (EN/עב) is available in the header and on auth pages. Language preference persists in localStorage.

## Code Quality

The project enforces strict code quality standards via automated tooling:

- **ESLint** — `strictTypeChecked` + `stylisticTypeChecked` with type-aware linting (`projectService`), `eslint-plugin-jsx-a11y` for accessibility, and `eslint-config-prettier` to prevent conflicts
- **Prettier** — Consistent formatting (100 char width, single quotes, trailing commas, LF endings)
- **TypeScript** — Strict mode with `noEmit` type checking
- **Husky + lint-staged** — Pre-commit hook runs Prettier and ESLint on staged files
- **GitHub Actions CI** — Two-job pipeline: `quality` (format:check + lint + type-check) and `test` (test:coverage + artifact upload)
- **EditorConfig** — Shared editor settings (UTF-8, LF, 2-space indent)
- **VS Code** — Shared settings (`.vscode/settings.json`) with format-on-save, ESLint auto-fix, and recommended extensions

## Key Patterns

- **Feature-based architecture** following Bulletproof React conventions
- **Flat Fetch, Client Assembly** — API returns flat lists, client builds tree structures
- **Path aliases** — `@features/*`, `@components/*`, `@lib/*`, `@hooks/*`, `@stores/*`, `@i18n/*`
- **Barrel exports** — Each module exposes a clean public API via `index.ts`
- **Optimistic updates** — All mutations (todos, tags, workspaces, members, groups, invitations) update the UI immediately, rolling back on failure
- **Centralized constants** — `src/constants/` with `as const` pattern for timing, z-index, storage keys, API values, keyboard shortcuts, and breakpoints. Semantic Tailwind z-index classes (`z-modal`, `z-toast`, etc.) derived from constants

## Testing

1118 tests across 66 test files using Vitest + React Testing Library + MSW.

```bash
pnpm test          # Watch mode
pnpm test:run      # Single run
pnpm test:coverage # With coverage report
```

**Test infrastructure:**

- MSW v2 handlers mock all API endpoints (auth, todos, tags, workspaces, notifications)
- Factory functions in `src/test/factories.ts` for generating test data
- Custom render wrapper in `src/test/test-utils.tsx` (QueryClientProvider + MemoryRouter)

**Coverage areas:**

- API clients (todoApi, tagApi, workspaceApi, invitationApi, ApiClient)
- React Query hooks with optimistic updates (useTodos, useTags, useWorkspaces, useWorkspaceMembers, useGroups, useInvitations)
- Zustand stores (todoUiStore, workspaceUiStore, authStore, toastStore, mobileNavStore)
- Components (CreateTodoForm, RegisterForm, LoginForm, WorkspaceSwitcher, MembersList, InviteMemberDialog, InvitationBanner, AcceptInvitation, CreateWorkspaceDialog, ActivityFeed, NotificationBell, NotificationPanel, NotificationItem, NotificationPreferences, NotificationsPage, Modal, Input, Button, BottomSheet, FAB, BottomNav, SettingsSheet, WorkspaceSheet, SwipeableTodoRow, TodoDetailSheet, QuickAddSheet, ReloadPrompt, OfflineIndicator, etc.)
- Notification hooks (useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useNotificationPreferences, useUpdateNotificationPreferences, useNotificationTypes)
- Notification utilities (formatNotificationMessage, getEntityRoute, getActorInitials)
- Utility hooks (useWorkspacePermission, useIsMobile, useDirection, useAnnounce, useFocusTrap)
- Validation schemas (authSchemas, workspaceSchemas)
- MSW handler integration tests

## Deployment

The app is configured for deployment on Render Free Tier with cold start handling. The `ColdStartBanner` component pings the backend health endpoint and shows a loading indicator while the server wakes up.

```bash
# Build for production
pnpm build

# Output: dist/
```
