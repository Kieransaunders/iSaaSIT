# iSaaSIT Directory Structure

## Top-Level Layout

```
/Users/boss/Develpment/iSaaSIT - Client portal/
├── .claude/                # Claude Code skills (domain knowledge)
├── .cursor/                # Cursor IDE rules and prompts
├── .netlify/               # Netlify deployment config
├── .planning/              # Project planning documents
├── .tanstack/              # TanStack Router generated cache
├── convex/                 # Backend (Convex functions)
├── dist/                   # Build output (generated)
├── docs/                   # Documentation site (Astro/Starlight)
├── node_modules/           # Dependencies
├── public/                 # Static assets
├── scripts/                # Build/setup scripts
├── screenshots/            # Project screenshots
├── src/                    # Frontend source code
├── .env.local              # Local environment variables
├── .env.local.example      # Environment template
├── convex.json             # Convex deployment config
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS config (Tailwind v4)
├── prettier.config.mjs     # Code formatting
├── tsconfig.json           # TypeScript config
└── vite.config.ts          # Vite build config
```

---

## Frontend Structure (`src/`)

```
src/
├── app.css                    # Global styles, Tailwind v4 imports
├── routeTree.gen.ts           # Auto-generated route tree (DO NOT EDIT)
├── router.tsx                 # Router configuration factory
├── start.ts                   # TanStack Start server entry
├── vite-env.d.ts              # Vite type declarations
├── components/
│   ├── billing/               # Billing-related components
│   │   ├── CapReachedBanner.tsx
│   │   ├── UpgradeButton.tsx
│   │   └── UsageProgress.tsx
│   ├── layout/                # Layout components
│   │   ├── app-sidebar.tsx    # Navigation sidebar
│   │   └── main-layout.tsx    # App shell with breadcrumbs
│   ├── providers/             # React context providers
│   │   └── theme-provider.tsx # Dark/light mode
│   ├── team/                  # Team management UI
│   │   ├── invite-dialog.tsx
│   │   └── team-table.tsx
│   └── ui/                    # shadcn/ui components
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── navigation-menu.tsx
│       ├── popover.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── hooks/
│   └── use-mobile.ts          # Mobile viewport detection
├── lib/
│   ├── constants.ts           # App constants (URLs, etc.)
│   └── utils.ts               # Utility functions (cn, etc.)
└── routes/                    # File-based routing
    ├── __root.tsx             # Root layout (all routes)
    ├── callback.tsx           # OAuth callback handler
    ├── index.tsx              # Landing page (/)
    ├── onboarding.tsx         # New user onboarding
    ├── _authenticated.tsx     # Protected layout wrapper
    └── _authenticated/        # Protected routes
        ├── authenticated.tsx  # Example protected page
        ├── billing.tsx        # Billing management
        ├── customers.tsx      # Customer list
        ├── customers/         # Customer sub-routes
        │   └── $customerId.tsx # Customer detail (/customers/:id)
        ├── dashboard.tsx      # Main dashboard
        ├── settings.tsx       # User settings
        └── team.tsx           # Team management
```

### Route Naming Conventions

| Pattern        | Example              | Result                 |
| -------------- | -------------------- | ---------------------- |
| `file.tsx`     | `index.tsx`          | `/`                    |
| `file.tsx`     | `dashboard.tsx`      | `/dashboard`           |
| `_prefix.tsx`  | `_authenticated.tsx` | Layout only (no URL)   |
| `dir/file.tsx` | `customers/$id.tsx`  | `/customers/:id`       |
| `__root.tsx`   | `__root.tsx`         | Root layout (required) |

---

## Backend Structure (`convex/`)

```
convex/
├── README.md                  # Convex documentation
├── _generated/                # Auto-generated (DO NOT EDIT)
│   ├── api.d.ts              # API type definitions
│   ├── dataModel.d.ts        # Database types
│   └── server.d.ts           # Server function types
├── assignments/               # Staff-customer assignments
│   ├── mutations.ts
│   └── queries.ts
├── auth.config.ts             # JWT auth configuration
├── billing/                   # Billing & usage
│   ├── actions.ts
│   └── queries.ts
├── customers/                 # Customer CRUD
│   └── crud.ts
├── http.ts                    # HTTP routes (webhooks)
├── invitations/               # User invitations
│   ├── internal.ts
│   ├── manage.ts
│   ├── queries.ts
│   └── send.ts
├── polar.ts                   # Payment integration
├── myFunctions.ts             # Template/example functions
├── orgs/                      # Organization management
│   ├── create.ts
│   ├── get.ts
│   └── update.ts
├── schema.ts                  # Database schema
├── tsconfig.json              # Convex TypeScript config
├── users/                     # User management
│   ├── create.ts
│   ├── manage.ts
│   ├── queries.ts
│   └── sync.ts
├── webhooks/                  # Webhook handlers
│   └── workos.ts
└── workos/                    # WorkOS integration
    ├── createOrg.ts
    ├── storeOrg.ts
    └── updateOrg.ts
```

### Convex File Naming

| File Type         | Naming           | Example                     |
| ----------------- | ---------------- | --------------------------- |
| Schema            | `schema.ts`      | `convex/schema.ts`          |
| HTTP routes       | `http.ts`        | `convex/http.ts`            |
| Auth config       | `auth.config.ts` | `convex/auth.config.ts`     |
| Feature queries   | `queries.ts`     | `convex/orgs/queries.ts`    |
| Feature mutations | `mutations.ts`   | `convex/orgs/mutations.ts`  |
| Feature actions   | `actions.ts`     | `convex/billing/actions.ts` |
| CRUD operations   | `crud.ts`        | `convex/customers/crud.ts`  |
| Webhook handler   | `[service].ts`   | `convex/webhooks/workos.ts` |

---

## Configuration Files

### Build & Development

| File                  | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `vite.config.ts`      | Vite build configuration, plugins, dev server |
| `tsconfig.json`       | TypeScript compiler options, path aliases     |
| `postcss.config.mjs`  | PostCSS config (Tailwind v4)                  |
| `prettier.config.mjs` | Code formatting rules                         |
| `eslint.config.mjs`   | Linting rules                                 |
| `convex.json`         | Convex deployment and AuthKit settings        |
| `netlify.toml`        | Netlify deployment configuration              |

### Path Aliases (from `tsconfig.json`)

```typescript
// Both map to ./src/*
import { Button } from '@/components/ui/button';
import { utils } from '~/lib/utils';
```

---

## Documentation (`docs/`)

```
docs/
├── astro.config.mjs           # Starlight configuration
├── package.json               # Docs dependencies
├── src/
│   └── content/
│       └── docs/
│           ├── index.mdx      # Docs homepage
│           ├── guides/        # User guides
│           └── reference/     # API reference
└── tsconfig.json              # Docs TypeScript config
```

---

## AI Assistant Resources (`.cursor/`, `.claude/`)

```
.cursor/
├── example-prompts.md         # Copy-paste prompts for tasks
└── rules/
    ├── 01-project-overview.mdc
    ├── 02-convex-patterns.mdc
    ├── 03-tanstack-router.mdc
    ├── 04-authentication.mdc
    ├── 05-multi-tenancy.mdc
    ├── 06-ui-components.mdc
    ├── 07-billing-integration.mdc
    └── 08-development-workflow.mdc

.claude/
└── skills/
    ├── astro-starlight/
    ├── convex/
    ├── shadcn-ui/
    ├── tailwind-v4/
    ├── tanstack/
    ├── ui-ux-pro-max/
    └── workos/
```

---

## Scripts (`scripts/`)

| Script                | Purpose                   |
| --------------------- | ------------------------- |
| `post-install.js`     | Post-install setup tasks  |
| `setup.js`            | Initial project setup     |
| `setup-gsd.js`        | GSD (Get Shit Done) setup |
| `preview-combined.js` | Preview combined build    |

---

## Where to Find Code

### By Concern

| Concern               | Location                                                 |
| --------------------- | -------------------------------------------------------- |
| **Routes/Pages**      | `src/routes/**/*.tsx`                                    |
| **Layout Components** | `src/components/layout/*.tsx`                            |
| **UI Components**     | `src/components/ui/*.tsx`                                |
| **Database Schema**   | `convex/schema.ts`                                       |
| **API Functions**     | `convex/**/*.ts` (except `_generated/`)                  |
| **Auth Logic**        | `src/routes/_authenticated.tsx`, `convex/auth.config.ts` |
| **Billing Logic**     | `convex/billing/`, `convex/polar.ts`                     |
| **Styling**           | `src/app.css`, component `className` props               |
| **Utilities**         | `src/lib/utils.ts`                                       |
| **Constants**         | `src/lib/constants.ts`                                   |
| **Webhooks**          | `convex/http.ts`, `convex/webhooks/`                     |
| **Hooks**             | `src/hooks/*.ts`                                         |

### By Task

| Task                 | Where to Look                                            |
| -------------------- | -------------------------------------------------------- |
| Add a new page       | `src/routes/`                                            |
| Change navigation    | `src/components/layout/app-sidebar.tsx`                  |
| Modify database      | `convex/schema.ts` → `convex/[feature]/`                 |
| Add API endpoint     | `convex/[feature]/[queries\|mutations].ts`               |
| Change auth behavior | `src/routes/_authenticated.tsx`, `convex/auth.config.ts` |
| Update billing       | `convex/billing/`, `convex/polar.ts`                     |
| Style changes        | `src/app.css`, Tailwind classes in components            |
| Add component        | `src/components/ui/` (shadcn pattern)                    |
| Handle webhooks      | `convex/http.ts`, `convex/webhooks/`                     |

---

## Auto-Generated Files (DO NOT EDIT)

These files are regenerated automatically and should not be manually modified:

| File                   | Generated By                                 |
| ---------------------- | -------------------------------------------- |
| `src/routeTree.gen.ts` | TanStack Router (`vite dev` or `vite build`) |
| `convex/_generated/*`  | Convex CLI (`convex dev` or `convex deploy`) |
| `tsconfig.tsbuildinfo` | TypeScript                                   |

---

## Environment Configuration

| File                 | Environment | Purpose                   |
| -------------------- | ----------- | ------------------------- |
| `.env.local`         | Local dev   | Local secrets and config  |
| `.env.local.example` | Template    | Template for `.env.local` |
| Netlify env vars     | Production  | Production secrets        |
| Convex env vars      | All         | Convex-specific settings  |

**Required Environment Variables**:

```bash
# WorkOS AuthKit
WORKOS_CLIENT_ID=client_xxx
WORKOS_API_KEY=sk_test_xxx
WORKOS_COOKIE_PASSWORD=xxx  # Min 32 chars
WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Convex
VITE_CONVEX_URL=https://xxx.convex.cloud
```
