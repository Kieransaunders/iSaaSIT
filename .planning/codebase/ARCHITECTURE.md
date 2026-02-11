# iSaaSIT Architecture

## Overview

iSaaSIT is a full-stack SaaS starter kit built on a modern architecture stack:

- **Frontend**: TanStack Start (full-stack React with SSR), TanStack Router, TanStack Query
- **Backend**: Convex (serverless, real-time database)
- **Auth**: WorkOS AuthKit (JWT-based authentication)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui components
- **Build**: Vite 7 with Netlify adapter

The architecture follows a multi-tenant pattern where an **Agency (Org)** manages multiple **Client Companies (Customers)** with role-based data isolation.

---

## Architectural Patterns

### 1. File-Based Routing (TanStack Router)

Routes are defined by file location in `src/routes/`:

```
src/routes/
├── __root.tsx              # Root layout (applies to all routes)
├── index.tsx               # Landing page (/)
├── callback.tsx            # OAuth callback handler
├── onboarding.tsx          # New user onboarding flow
└── _authenticated/         # Protected routes (layout prefix)
    ├── _authenticated.tsx  # Auth guard layout
    ├── dashboard.tsx       # /dashboard
    ├── customers.tsx       # /customers
    ├── customers/
    │   └── $customerId.tsx # /customers/:customerId (dynamic)
    ├── billing.tsx         # /billing
    ├── team.tsx            # /team
    └── settings.tsx        # /settings
```

**Key Pattern**: Files starting with `_` are layout routes that don't create URL segments. The `_authenticated.tsx` layout provides route protection via loader-based guards.

### 2. Server-Side Rendering (SSR) with TanStack Start

- **Entry Point**: `src/start.ts` configures the TanStack Start instance with WorkOS middleware
- **Server Functions**: `createServerFn()` for server-side logic that runs before hydration
- **Hydration**: Client takes over after initial SSR, enabling SPA behavior

### 3. Real-Time Data with Convex

Convex provides reactive queries that update automatically when underlying data changes:

```typescript
// Component subscribes to live data
const customers = useQuery(api.customers.list);
// Automatically re-renders when data changes - no polling needed
```

**Function Types**:

- `query` - Read-only, cached, reactive
- `mutation` - Write operations, transactional
- `action` - Side effects, HTTP calls, non-transactional
- `internalQuery`/`internalMutation` - Called only by other Convex functions

### 4. Multi-Tenant Data Isolation

Three-tier role system with data visibility rules:

| Role       | Data Visibility                |
| ---------- | ------------------------------ |
| **Admin**  | All org data, billing, invites |
| **Staff**  | Only assigned customers        |
| **Client** | Only own customer data         |

**Enforcement**: Row-level security via Convex query filters based on user's role and assignments.

### 5. Webhook-Driven External Sync

External services communicate via webhooks:

- **WorkOS** → `convex/webhooks/workos.ts` (user/org events)
- **Polar** → `convex/http.ts` (billing events via `polar.registerRoutes`)

---

## System Layers

### Layer 1: Presentation (Frontend)

**Location**: `src/routes/`, `src/components/`

**Responsibilities**:

- Route components and layouts
- UI components (shadcn/ui-based)
- Client-side state (minimal - prefer server state)
- Form handling and validation

**Key Files**:

- `src/routes/__root.tsx` - Root provider setup (AuthKit, Convex, Theme)
- `src/routes/_authenticated.tsx` - Auth guard and main layout wrapper
- `src/components/layout/main-layout.tsx` - App shell with sidebar
- `src/components/ui/*` - shadcn/ui component library

### Layer 2: Application Services (Frontend)

**Location**: `src/router.tsx`, `src/hooks/`, `src/lib/`

**Responsibilities**:

- Router configuration with Convex + Query integration
- Auth integration hooks
- Utility functions

**Key Files**:

- `src/router.tsx` - Router factory with Convex QueryClient setup
- `src/lib/utils.ts` - Tailwind class merging (`cn()` function)
- `src/lib/constants.ts` - App-wide constants

### Layer 3: API Layer (Convex)

**Location**: `convex/`

**Responsibilities**:

- Database schema definition
- Query/mutation/action functions
- Authentication/authorization
- Webhook handlers
- External API integrations

**Organization**:

```
convex/
├── schema.ts              # Database tables and indexes
├── auth.config.ts         # JWT validation config
├── http.ts                # HTTP route definitions (webhooks)
├── _generated/            # Auto-generated types
├── myFunctions.ts         # Template/example functions
├── assignments/           # Staff-customer assignment logic
├── billing/               # Usage tracking, billing queries
├── customers/             # Customer CRUD operations
├── invitations/           # User invitation flow
├── polar.ts               # Payment provider integration
├── orgs/                  # Organization management
├── users/                 # User sync and management
├── webhooks/              # Webhook handlers
└── workos/                # WorkOS integration helpers
```

### Layer 4: Data Layer (Convex Database)

**Schema Tables**:

- `orgs` - Agencies with subscription data
- `customers` - Client companies (belong to orgs)
- `users` - Extended user profiles with roles
- `staffCustomerAssignments` - Many-to-many staff-customer mapping
- `pendingInvitations` - Outstanding invitations

---

## Data Flow

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  WorkOS     │────▶│   /callback │
│  (sign in)  │     │  AuthKit    │     │    route    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ TanStack    │
                                        │ Start       │
                                        │ Middleware  │
                                        └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Convex     │◀────│  JWT Token  │────▶│  Context    │
│  (validate) │     │  (cookie)   │     │  Available  │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Code Path**:

1. `src/start.ts` - WorkOS middleware attaches auth to requests
2. `src/routes/__root.tsx` - `fetchWorkosAuth` server function gets auth state
3. `src/routes/__root.tsx` - `ConvexProviderWithAuth` passes token to Convex
4. `convex/auth.config.ts` - Validates JWT tokens from WorkOS

### Protected Route Flow

```
User ──▶ /dashboard ──▶ _authenticated.tsx loader ──▶ getAuth()
                                                     │
                              ┌──────────────────────┘
                              ▼
                        ┌───────────┐
                        │  User?    │──── No ───▶ redirect to sign-in
                        └─────┬─────┘
                              │ Yes
                              ▼
                        ┌───────────┐
                        │  Org?     │──── No ───▶ redirect to /onboarding
                        └─────┬─────┘
                              │ Yes
                              ▼
                        Render Dashboard
```

**Code Path**:

- `src/routes/_authenticated.tsx` - Loader checks auth, redirects if needed
- `src/routes/onboarding.tsx` - Org creation flow for new users

### Data Fetching Flow (Convex + React Query)

```
Component ──▶ useQuery(api.module.function) ──▶ ConvexQueryClient
                                                    │
                                                    ▼
                                           ┌──────────────┐
                                           │ React Query  │
                                           │ Cache Check  │
                                           └──────┬───────┘
                                                  │
                              Cache Hit ◀─────────┴─────────▶ Cache Miss
                                  │                              │
                                  ▼                              ▼
                           Return cached                HTTP to Convex
                           data immediately              function
                                                                  │
                                                                  ▼
                                                           ┌────────────┐
                                                           │  Convex    │
                                                           │  Function  │
                                                           │  Handler   │
                                                           └─────┬──────┘
                                                                 │
                    ┌─────────────────────────────────────────────┼────────────────────────┐
                    │                                             │                        │
                    ▼                                             ▼                        ▼
            ┌──────────────┐                           ┌──────────────┐         ┌──────────────┐
            │     query    │                           │   mutation   │         │    action    │
            └──────┬───────┘                           └──────┬───────┘         └──────┬───────┘
                   │                                         │                        │
                   ▼                                         ▼                        ▼
            ┌──────────────┐                           ┌──────────────┐         ┌──────────────┐
            │  Read from   │                           │  Write to    │         │  External    │
            │  Database    │                           │  Database    │         │  API Call    │
            └──────────────┘                           └──────────────┘         └──────────────┘
```

### Webhook Data Flow

**WorkOS Webhook (User invited)**:

```
WorkOS ──POST──▶ /webhooks/workos ──▶ convex/http.ts ──▶ handleWorkOSWebhook()
                                                             │
                                                             ▼
                                                    ┌────────────────┐
                                                    │ Process event  │
                                                    │ (user.created, │
                                                    │ invitation.    │
                                                    │ accepted, etc) │
                                                    └───────┬────────┘
                                                            │
                    ┌───────────────────────────────────────┼───────────────────────┐
                    │                                       │                       │
                    ▼                                       ▼                       ▼
            ┌──────────────┐                      ┌──────────────┐        ┌──────────────┐
            │ Create user  │                      │ Update user  │        │ Send email   │
            │ record       │                      │ org/role     │        │ notification │
            └──────────────┘                      └──────────────┘        └──────────────┘
```

---

## Key Abstractions and Interfaces

### Router Context

Defined in `src/routes/__root.tsx`:

```typescript
interface RouterContext {
  queryClient: QueryClient; // TanStack Query client
  convexClient: ConvexReactClient; // Convex client instance
  convexQueryClient: ConvexQueryClient; // Bridge between Query and Convex
}
```

Passed to all routes via `createRootRouteWithContext<RouterContext>()`.

### Authentication Types

From WorkOS AuthKit:

```typescript
// Server-side auth
const { user, accessToken } = await getAuth();
// user: { id, email, firstName, lastName, organizationId, ... }

// Client-side auth
const { user, loading } = useAuth();
const { accessToken, getAccessToken } = useAccessToken();
```

### Convex Function Context

All Convex functions receive a context object:

```typescript
// Queries/Mutations
async (ctx, args) => {
  ctx.auth.getUserIdentity(); // Get authenticated user
  ctx.db.query('table'); // Database queries
  ctx.db.get(id); // Get by ID
  ctx.db.insert('table', doc); // Insert document
  ctx.db.patch('table', id, { field: value }); // Partial update
};

// Actions
async (ctx, args) => {
  ctx.runQuery(api.other.query, args); // Call query
  ctx.runMutation(api.other.mutation, args); // Call mutation
  ctx.fetch('https://api.example.com'); // HTTP requests
};
```

### Database Schema Types

Key table shapes from `convex/schema.ts`:

```typescript
// Org (Agency)
{
  workosOrgId: string;
  name: string;
  billingEmail?: string;
  subscriptionId?: string;
  subscriptionStatus: "inactive" | "active" | "cancelled" | ...;
  planId?: string;
  maxCustomers: number;
  maxStaff: number;
  maxClients: number;
}

// User
{
  workosUserId: string;
  orgId?: Id<"orgs">;
  role?: "admin" | "staff" | "client";
  customerId?: Id<"customers">;  // For client role
  email: string;
  firstName?: string;
  lastName?: string;
}

// Customer
{
  orgId: Id<"orgs">;
  name: string;
  email?: string;
  notes?: string;
}
```

---

## Entry Points

### Application Entry Points

| Entry Point             | Purpose                              |
| ----------------------- | ------------------------------------ |
| `src/start.ts`          | TanStack Start server configuration  |
| `src/router.tsx`        | Router factory (called by framework) |
| `src/routes/__root.tsx` | Root React component with providers  |
| `src/app.css`           | Global styles, Tailwind imports      |

### Development Entry Points

```bash
# Full stack (frontend + backend)
npm run dev

# Frontend only
npm run dev:frontend  # Vite dev server on port 3000

# Backend only
npm run dev:backend   # Convex dev server

# Docs site
npm run dev:docs      # Astro/Starlight on port 4321
```

### Build Entry Points

```bash
# Production build
npm run build         # Vite production build → dist/

# Combined build (app + docs)
npm run build:combined
```

### Key Convex Entry Points

| File                         | Purpose                    |
| ---------------------------- | -------------------------- |
| `convex/schema.ts`           | Database schema definition |
| `convex/http.ts`             | HTTP routes (webhooks)     |
| `convex/auth.config.ts`      | JWT validation for auth    |
| `convex/_generated/api.d.ts` | Auto-generated API types   |

---

## Data Flow Summary

1. **User Request** → TanStack Router matches route file
2. **Route Loader** (if any) → Server function fetches initial data
3. **SSR** → React renders on server with loaded data
4. **Hydration** → Client takes over, React Query hydrates cache
5. **Client Navigation** → TanStack Router handles, Convex queries subscribe
6. **Real-time Updates** → Convex pushes changes, components auto-re-render
7. **Mutations** → `useMutation` → Convex → Database → Reactive updates
