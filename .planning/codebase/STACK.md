# Technology Stack

**Analysis Date:** 2026-02-09

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code, frontend and backend
- JSX/TSX - React component syntax used throughout UI layer

**Secondary:**
- JavaScript - Configuration files (vite.config.ts, eslint.config.mjs, etc.)

## Runtime

**Environment:**
- Node.js v24.12.0 (as of environment check, no pinned version in .nvmrc or package.json)

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` (present, 581KB)

## Frameworks

**Core:**
- React 19.2.4 - UI framework with React DOM 19.2.4
- TanStack Start 1.158.0 - Full-stack React meta-framework with file-based routing
- TanStack React Router 1.158.0 - Type-safe routing layer
- TanStack React Router SSR Query 1.158.0 - SSR and query integration

**Backend:**
- Convex 1.31.7 - Backend-as-a-Service (BaaS) platform for database, server logic, and auth
- Convex React integration via `convex/react` - Client library for queries, mutations, actions
- Convex Query Client (@convex-dev/react-query) 0.1.0 - Integration bridge with TanStack React Query

**Authentication:**
- WorkOS AuthKit (@workos/authkit-tanstack-react-start) 0.5.0 - Enterprise authentication and SSO
- WorkOS Node SDK (@workos-inc/node) 8.1.0 - Server-side WorkOS API client
- Custom JWT providers via Convex auth.config.ts - RS256 validation

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- TailwindCSS PostCSS (@tailwindcss/postcss) 4.1.18 - PostCSS integration
- Class Variance Authority 0.7.1 - CSS class composition for component variants
- Tailwind Merge 3.4.0 - Utilities for merging Tailwind classes
- Lucide React 0.563.0 - Icon library
- Radix UI 1.4.3 and @radix-ui/react-slot 1.2.4 - Headless UI components

**Data & State:**
- TanStack React Query 5.90.20 - Server state management and caching
- Convex react-query integration - Synced Convex data with React Query

**Data Validation:**
- Convex values module (`convex/values`) - Schema validation with v.* validators

## Testing & Code Quality

**Testing Framework:**
- Not detected in dependencies - No explicit test runner configured

**Linting & Formatting:**
- TypeScript 5.9.3 - Type checking
- ESLint with @tanstack/eslint-config 0.3.4 - Code linting
- @convex-dev/eslint-plugin 1.1.1 - Convex-specific linting rules
- Prettier 3.8.1 - Code formatting

**Type Checking:**
- TypeScript strict mode enabled (`strict: true` in tsconfig.json)
- Strict null checks enabled
- JSX: "react-jsx" (React 17+ syntax)
- Module resolution: Bundler (for modern bundlers)

## Build & Development Tools

**Build:**
- Vite 7.3.1 - Frontend bundler and dev server
- @vitejs/plugin-react 5.1.3 - React support for Vite
- Vite TSConfig Paths 6.0.5 - TypeScript path resolution
- Convex build integration - Handles backend build

**Development:**
- npm-run-all2 8.0.4 - Parallel script execution for dev:frontend and dev:backend
- Convex dev CLI - Local development backend
- TanStack React Router DevTools 1.158.0 - Router debugging
- dotenv 17.2.3 - Environment variable loading

**Hosting & Deployment:**
- Netlify - Deployment target (via .netlify/netlify.toml)
- @netlify/vite-plugin-tanstack-start 1.2.8 - Netlify Functions integration for SSR

## Key Dependencies

**Critical:**
- Convex 1.31.7 - Entire backend, database, real-time sync, auth hooks
- TanStack Start 1.158.0 - Full-stack framework, routing, SSR orchestration
- WorkOS AuthKit 0.5.0 - Enterprise authentication without building auth from scratch
- React 19.2.4 - Component foundation

**Infrastructure:**
- TanStack React Query 5.90.20 - Server state synchronization and caching
- TypeScript 5.9.3 - Type safety across entire codebase

**UI Components:**
- Radix UI 1.4.3 - Unstyled, accessible component primitives
- Class Variance Authority 0.7.1 - Type-safe component styling
- Lucide React 0.563.0 - Icon SVGs (563+ icons)

## Configuration

**Environment:**
- `.env.local` or `.env` loaded by Vite via dotenv
- Critical vars:
  - `WORKOS_CLIENT_ID` - WorkOS application ID
  - `WORKOS_API_KEY` - WorkOS API key for backend actions
  - `WORKOS_COOKIE_PASSWORD` - Session encryption (min 32 characters)
  - `WORKOS_REDIRECT_URI` - OAuth callback URL (http://localhost:3000/callback in dev)
  - `VITE_CONVEX_URL` - Convex deployment URL (prefixed with VITE_ to expose to frontend)

**Build Configuration:**
- `vite.config.ts` - Main Vite configuration with plugins and port 3000
- `tsconfig.json` - TypeScript with path aliases (@/* and ~/* both map to ./src/*)
- `tailwind.config.ts` or auto-generated - Tailwind v4 configuration
- `prettier.config.mjs` - Code formatting rules
- `eslint.config.mjs` - ESLint rules
- `postcss.config.mjs` - PostCSS for Tailwind
- `convex.json` - Convex configuration with AuthKit setup for dev/preview/prod environments

**Convex Auth Config:**
- `convex/auth.config.ts` - Defines JWT providers:
  - WorkOS SSO provider: Issues from https://api.workos.com/, RS256 algorithm
  - WorkOS User Management provider: Issues from https://api.workos.com/user_management/{clientId}
  - Validates against https://api.workos.com/sso/jwks/{clientId}

## Platform Requirements

**Development:**
- Node.js v24+ (tested, no minimum enforced in package.json)
- npm v10+ (assumed, lockfile format suggests modern npm)
- OS: Cross-platform (darwin/linux/windows compatible)
- 2GB+ free disk (node_modules + Convex cache)

**Production:**
- Convex deployment (cloud, managed by Convex Inc)
- Netlify deployment (via @netlify/vite-plugin-tanstack-start)
- WorkOS account (for authentication endpoints)
- HTTPS required (Netlify handles SSL)

## Build Scripts

```bash
npm run dev              # Parallel frontend (Vite) + backend (Convex)
npm run dev:frontend    # Vite dev server only
npm run dev:backend     # Convex dev CLI
npm run build           # Production build (Vite)
npm run lint            # TypeScript check + ESLint
npm run format          # Prettier code formatting
npm run setup           # Initial configuration wizard
```

---

*Stack analysis: 2026-02-09*
