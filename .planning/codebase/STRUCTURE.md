# Codebase Structure

**Analysis Date:** 2026-02-09

## Directory Layout

```
iSaaSIT/
├── src/                    # Frontend SaaS application (TanStack Start + React)
│   ├── routes/            # File-based routing and pages
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utilities and constants
│   ├── hooks/             # Custom React hooks
│   ├── router.tsx         # Router initialization
│   ├── start.ts           # TanStack Start entry point
│   ├── app.css            # Global styles (Tailwind)
│   └── routeTree.gen.ts   # Generated file-based route manifest
│
├── convex/                # Backend (Convex backend-as-a-service)
│   ├── schema.ts          # Database schema definitions
│   ├── auth.config.ts     # WorkOS JWT authentication config
│   ├── customers/         # Customer CRUD operations
│   ├── orgs/              # Organization queries and mutations
│   ├── users/             # User creation and management
│   ├── workos/            # WorkOS SDK integration (actions)
│   ├── myFunctions.ts     # Legacy template functions (to migrate)
│   ├── _generated/        # Auto-generated Convex types and API (git-ignored)
│   └── README.md          # Convex backend documentation
│
├── public/                # Static assets (favicon, etc.)
├── scripts/               # Build and setup scripts
├── docs/                  # Documentation site (separate Astro project)
├── .planning/             # GSD planning and analysis documents
│   ├── codebase/         # Architecture/structure analysis
│   ├── phases/           # Implementation phase plans
│   ├── research/         # Research synthesis
│   └── todos/            # Task tracking
│
├── .claude/              # Claude AI skills and references
├── .cursor/              # Cursor IDE rules and templates
├── .netlify/             # Netlify deployment config
├── .vscode/              # VSCode settings
│
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Node.js dependencies
├── convex.json           # Convex deployment config
└── netlify.toml          # Netlify deployment manifest
```

## Directory Purposes

**src/routes/:**
- Purpose: Page components with TanStack Router file-based routing
- Contains: `.tsx` files representing URL routes
- Key files:
  - `__root.tsx`: App root with global layout and auth fetching
  - `index.tsx`: Landing page (public, shows marketing or authenticated home)
  - `_authenticated.tsx`: Layout wrapper for protected routes
  - `onboarding.tsx`: Organization creation flow
  - `callback.tsx`: WorkOS OAuth redirect handler
  - `_authenticated/dashboard.tsx`: Main app dashboard
  - `_authenticated/customers.tsx`: Customer list
  - `_authenticated/team.tsx`: Team/members management
  - `_authenticated/settings.tsx`: Workspace settings
  - `_authenticated/billing.tsx`: Billing and subscription

**src/components/:**
- Purpose: Reusable React components
- Contains: UI components and layout components
- Subdirectories:
  - `ui/`: shadcn/ui components (button, card, input, etc.) - auto-generated from template
  - `layout/`: Layout components (main-layout.tsx, app-sidebar.tsx)
  - `providers/`: Context providers (theme-provider.tsx)
  - Root: Mode toggle component

**src/lib/:**
- Purpose: Shared utilities and constants
- Contains:
  - `constants.ts`: URLs for docs and blog (environment-aware)
  - `utils.ts`: Helper functions

**src/hooks/:**
- Purpose: Custom React hooks
- Contains:
  - `use-mobile.ts`: Responsive design breakpoint hook

**convex/schema.ts:**
- Purpose: Data model definition
- Tables:
  - `orgs`: Organizations (synced from WorkOS, extended with subscription data)
    - Indices: by_workos_org_id, by_subscription_id
  - `customers`: Client companies managed by org
    - Indices: by_org, by_org_name
  - `users`: User profiles (extends WorkOS data)
    - Indices: by_workos_user_id, by_org, by_org_role, by_customer
  - `staffCustomerAssignments`: Maps staff to customers they can access
    - Indices: by_staff, by_customer, by_org, by_staff_customer
  - `numbers`: Legacy template table (to be removed)

**convex/customers/:**
- Purpose: Customer management operations
- Files:
  - `crud.ts`: All customer operations (list, get, create, update, delete, usage tracking)

**convex/orgs/:**
- Purpose: Organization queries and mutations
- Files:
  - `get.ts`: Query operations (getMyOrg, getOrgById, hasOrg, getMyOrgInternal)
  - `create.ts`: Org creation mutations (createOrg, getOrCreateMyOrg)
  - `update.ts`: Org update operations

**convex/users/:**
- Purpose: User creation and syncing
- Files:
  - `create.ts`: User creation and profile management

**convex/workos/:**
- Purpose: WorkOS SDK integration
- Files:
  - `createOrg.ts`: Create org in WorkOS and Convex (action with "use node")
  - `updateOrg.ts`: Update org in WorkOS
  - `storeOrg.ts`: Internal mutation to persist org in Convex

**convex/auth.config.ts:**
- Purpose: Configure JWT authentication with WorkOS
- Defines: Two JWT providers (SSO and User Management) both validating against WorkOS JWKS

## Key File Locations

**Entry Points:**
- `src/start.ts`: Application initialization with TanStack Start
- `src/router.tsx`: Router factory function (creates and returns router instance)
- `vite.config.ts`: Build configuration
- `convex.json`: Backend deployment config

**Configuration:**
- `tsconfig.json`: TypeScript settings with path aliases (@/*, ~/* → src/*)
- `.env.local`: Environment variables (VITE_CONVEX_URL, WORKOS_* keys)
- `convex.json`: Convex backend settings

**Core Logic:**
- `convex/schema.ts`: Complete data model
- `convex/auth.config.ts`: Authentication configuration
- `src/router.tsx`: Frontend routing and provider setup
- `src/routes/__root.tsx`: Root layout and auth initialization

**Testing:**
- No test files currently found (testing patterns to be established)

**UI Components:**
- `src/components/ui/`: Shadcn/ui library (27+ components)
- `src/components/layout/main-layout.tsx`: App frame with sidebar
- `src/components/layout/app-sidebar.tsx`: Sidebar navigation

## Naming Conventions

**Files:**
- Routes: Lowercase with underscores for layout groups (`_authenticated.tsx`, `_authenticated/dashboard.tsx`)
- Components: PascalCase (`MainLayout.tsx`, `AppSidebar.tsx`, `ModeToggle.tsx`)
- Utils/Hooks: camelCase (`use-mobile.ts`, `constants.ts`)
- Database functions: camelCase with category prefix (`listCustomers`, `getMyOrg`, `createOrganization`)

**Directories:**
- Feature folders: Lowercase plural (`customers/`, `orgs/`, `users/`, `workos/`)
- Component directories: Lowercase descriptive (`ui/`, `layout/`, `providers/`, `hooks/`)

**TypeScript/Code:**
- Types: PascalCase (`ConvexError`, `AuthConfig`)
- Functions: camelCase (`createServerFn()`, `createFileRoute()`)
- Variables: camelCase (`workosUserId`, `orgId`, `isLoading`)
- Constants: UPPER_CASE (`BLOG_URL`, `DOCS_URL`)
- React hooks: camelCase starting with `use` (`useQuery`, `useMutation`, `useAuth`)

## Where to Add New Code

**New Feature:**
- API/Backend: Create folder in `convex/` (e.g., `convex/invoices/`)
  - Add CRUD operations: `convex/invoices/crud.ts` (queries and mutations)
  - If calling external APIs: Create action file `convex/invoices/sync.ts` with `"use node"`
  - Update `convex/schema.ts` to add table definition
- Frontend: Create route file `src/routes/_authenticated/invoices.tsx`
  - Import queries/mutations from generated API: `import { api } from '../../convex/_generated/api'`
  - Use `useQuery()` for reads, `useAction()` for mutations
  - Create components in `src/components/` if reusable

**New Component/Module:**
- Shared component: Add to `src/components/[category]/ComponentName.tsx`
  - Reusable UI: Place in `src/components/ui/`
  - Layout/structure: Place in `src/components/layout/`
  - Feature-specific: Create folder: `src/components/[feature]/ComponentName.tsx`
- Custom hook: Create as `src/hooks/use-[name].ts`
- Utility function: Add to `src/lib/utils.ts` or create new file in `src/lib/`

**New Page/Route:**
- Protected page: Create `src/routes/_authenticated/[page-name].tsx`
- Public page: Create `src/routes/[page-name].tsx`
- Use `createFileRoute('/path')` with context typing
- Loader functions use `createServerFn()` for auth/data fetching

**Database Queries:**
- Simple reads: Add to existing `convex/[feature]/` file as query
- External API calls: Create `[feature]/action.ts` with `"use node"` pragma
- Complex joins: Keep in same file with queries that use them
- Always use indexes for queries with where clauses

## Special Directories

**convex/_generated/:**
- Purpose: Auto-generated types, API exports, and data model
- Generated: Yes, by Convex CLI
- Committed: No (in .gitignore)
- Purpose: Provides type-safe API for frontend (`import { api } from '../../convex/_generated/api'`)
- Regenerated on: `npx convex dev` or `npx convex push`

**.planning/:**
- Purpose: GSD orchestrator planning and analysis documents
- Generated: Partially (phase documents created by GSD)
- Committed: Yes
- Contains: Architecture analysis, phase plans, research, todos

**dist/:**
- Purpose: Built frontend application
- Generated: Yes, by `npm run build`
- Committed: No (in .gitignore)
- Deployed to: Netlify

**.netlify/**:
- Purpose: Local Netlify CLI cache and function stubs
- Generated: Yes, during local development
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-02-09*
