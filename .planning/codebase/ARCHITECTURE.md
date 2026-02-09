# Architecture

**Analysis Date:** 2026-02-09

## Pattern Overview

**Overall:** Full-stack SaaS application with clear separation between frontend (TanStack Start/React) and backend (Convex). Multi-tenant architecture with role-based access control at the database level.

**Key Characteristics:**
- Server-side rendering via TanStack Start with React Router v6 file-based routing
- Backend-as-a-service model using Convex for database, queries, and mutations
- Authentication via WorkOS with SSO/magic link support
- Multi-tenancy with row-level security enforced in Convex
- Real-time data synchronization between frontend and Convex via React Query
- Type safety across the stack with TypeScript end-to-end

## Layers

**Presentation Layer:**
- Purpose: UI components and page layouts for user interactions
- Location: `src/routes/`, `src/components/`
- Contains: Route components, UI components (shadcn/ui), layout wrappers
- Depends on: React Query hooks, Convex API, TanStack Router
- Used by: Direct user interactions through browser

**Routing & Page Layer:**
- Purpose: File-based routing and page composition with server-side data loading
- Location: `src/routes/`
- Contains: Route definitions with `createFileRoute()`, server functions via `createServerFn()`, loader logic
- Depends on: TanStack Router, WorkOS Auth, Convex context
- Used by: Entry point is `src/router.tsx` which initializes all routes

**Server Function Layer:**
- Purpose: Server-side code that runs during SSR or as actions, bridging frontend and backend
- Location: Inline in route files (e.g., `src/routes/__root.tsx` has `fetchWorkosAuth`)
- Contains: `createServerFn()` handlers for auth checks, data fetching
- Depends on: WorkOS SDK, Convex client
- Used by: Route loaders and client-side mutations

**Data Layer (Frontend-side):**
- Purpose: State management, caching, and synchronization with Convex
- Location: Managed through Convex React Query integration
- Contains: React Query configuration, hook-based data fetching via `useQuery()`
- Depends on: Convex React client, React Query
- Used by: All components needing real-time data

**Backend Layer (Convex):**
- Purpose: Database, queries, mutations, actions, and authentication
- Location: `convex/`
- Contains:
  - `schema.ts`: Data model definitions (orgs, users, customers, staffCustomerAssignments)
  - `auth.config.ts`: JWT authentication with WorkOS
  - `queries/`: Read operations (e.g., `customers/crud.ts`, `orgs/get.ts`)
  - `mutations/`: Write operations (e.g., `customers/crud.ts`, `orgs/create.ts`)
  - `actions/`: Server-side actions with external API access (e.g., `workos/createOrg.ts`)
- Depends on: WorkOS SDK, Convex framework
- Used by: Frontend via React Query, also callable from server functions

## Data Flow

**Authentication Flow:**

1. User navigates to landing page (`/`)
2. `index.tsx` loader calls `fetchWorkosAuth()` server function
3. Server function calls `getAuth()` from WorkOS authkit
4. Auth state determines if user sees landing or authenticated home
5. On login, WorkOS redirects to callback handler (`src/routes/callback.tsx`)
6. Frontend stores auth token in Convex query client via `useAuthFromWorkOS()`
7. All subsequent Convex requests include auth token in JWT

**Organization Creation Flow:**

1. Authenticated user without org redirected to `/onboarding`
2. User submits form with org name + billing email
3. Frontend calls `api.workos.createOrg.createOrganization` action
4. Action uses WorkOS SDK to:
   - Create organization in WorkOS
   - Create membership for user as admin
5. Action calls internal mutation `storeOrg()` to save in Convex
6. `storeOrg()` creates org record with free tier defaults (3 customers, 2 staff, 10 clients)
7. `storeOrg()` creates user record linking WorkOS user to Convex org
8. Frontend redirects to `/dashboard`

**Data Access Flow:**

1. Component calls `useQuery(api.customers.list)`
2. Convex query `customers.list()` executes in backend
3. Query retrieves authenticated user identity from JWT
4. Looks up user record by WorkOS user ID
5. Based on user role:
   - Admin: Returns all customers in org
   - Staff: Returns only assigned customers via `staffCustomerAssignments` index
   - Client: Returns only their own customer record
6. React Query caches result and subscribes to real-time updates
7. When data changes, Convex notifies via WebSocket, React Query re-renders

**State Management:**

- **Client State:** Component-local state via `useState()` (e.g., form inputs, UI toggles)
- **Server State:** Managed by Convex queries subscribed via React Query `useQuery()`
- **Auth State:** Stored in WorkOS AuthKit provider, accessible via `useAuth()` hook
- **Router State:** Managed by TanStack Router with context passed via `router.context`
- **Caching Strategy:** React Query with 5-second garbage collection time (GC time), Convex handles WebSocket subscriptions for real-time updates

## Key Abstractions

**Query/Mutation Pattern:**
- Purpose: Encapsulate backend operations in Convex
- Examples: `convex/customers/crud.ts`, `convex/orgs/get.ts`, `convex/workos/createOrg.ts`
- Pattern: Queries are read-only, mutations modify data, actions can call external APIs with `"use node"`
- All enforce authentication via `ctx.auth.getUserIdentity()` and authorization via role checking

**Role-Based Access Control (RBAC):**
- Purpose: Data scoping at the database level for multi-tenancy
- Roles: admin, staff, client
- Implementation: Each query checks `userRecord.role` and returns different data sets
- Example: `customers/crud.ts:listCustomers()` returns all customers for admin, assigned only for staff, own only for client

**Server Functions:**
- Purpose: Bridge between frontend (TanStack Start) and backend (Convex)
- Examples: `src/routes/__root.tsx:fetchWorkosAuth()`, `src/routes/onboarding.tsx` uses `createServerFn()`
- Pattern: Marked with `createServerFn({ method: 'GET/POST' }).handler()`
- Use Case: Auth checks, environment-sensitive operations, SSR data loading

**WorkOS Integration Layer:**
- Purpose: Centralize WorkOS API interactions in dedicated action handlers
- Location: `convex/workos/`
- Pattern: Actions (marked with `"use node"`) that import WorkOS SDK
- Examples: `createOrg.ts` (creates org + membership), `updateOrg.ts`, `storeOrg.ts`
- Decoupling: Frontend doesn't directly call WorkOS, always goes through Convex

## Entry Points

**Frontend Entry:**
- Location: `src/start.ts`
- Triggers: Browser navigates to app
- Responsibilities: Initializes TanStack Start instance with WorkOS auth middleware

**Router Entry:**
- Location: `src/router.tsx` (via `getRouter()`)
- Triggers: App loads
- Responsibilities:
  - Creates React Router with file-based routes
  - Initializes Convex React client with `ConvexReactClient`
  - Sets up React Query with Convex integration
  - Wraps app with `AuthKitProvider` and `ConvexProviderWithAuth`
  - Returns router instance for hydration

**Root Route:**
- Location: `src/routes/__root.tsx`
- Triggers: All routes render
- Responsibilities:
  - Server function `fetchWorkosAuth()` runs during SSR to get auth token
  - Sets auth token on Convex query client for authenticated requests
  - Wraps entire app with theme provider and HTML document structure

**Layout Route:**
- Location: `src/routes/_authenticated.tsx`
- Triggers: User accesses protected routes under `/_authenticated/**`
- Responsibilities:
  - Loader checks if user is authenticated via WorkOS
  - Redirects unauthenticated users to sign-in URL
  - Wraps content in `MainLayout` with sidebar and breadcrumbs

**Onboarding Entry:**
- Location: `src/routes/onboarding.tsx`
- Triggers: New user after authentication
- Responsibilities:
  - Checks if user already has an org
  - If not, shows form to create org
  - Calls `api.workos.createOrg.createOrganization` action
  - Redirects to dashboard on success

## Error Handling

**Strategy:** Layered error handling with user-friendly messages propagating from backend to frontend

**Patterns:**

- **Backend (Convex):** Throw `ConvexError` with message: `throw new ConvexError("User not associated with organization")`
- **Frontend Route Loaders:** Throw redirect for auth failures: `throw redirect({ href })`
- **Frontend Components:** Try/catch around mutations, display in error UI: `try { await action() } catch (err) { setError(err.message) }`
- **Default Route Error:** `defaultErrorComponent` in router shows error stack for debugging

## Cross-Cutting Concerns

**Logging:**
- Approach: `console.log()` for debugging (dev mode), no structured logging currently in place
- Future: Could integrate Convex logging or third-party service

**Validation:**
- Approach: Client-side HTML5 validation (required, type="email"), backend validation in mutations
- Example: Email validation in onboarding form, plan limits checked before creating customers

**Authentication:**
- Approach: WorkOS handles session, JWT tokens passed to Convex via React Query client
- Custom hook `useAuthFromWorkOS()` in `router.tsx` bridges WorkOS auth state to Convex

**Authorization:**
- Approach: Role-based checks in every Convex query/mutation
- Enforcement: `ctx.auth.getUserIdentity()` gets user identity, role lookup determines data access

---

*Architecture analysis: 2026-02-09*
