# Coding Conventions

**Analysis Date:** 2026-02-09

## Naming Patterns

**Files:**
- Component files: `PascalCase.tsx` for React components (e.g., `Button.tsx`, `MainLayout.tsx`, `AppSidebar.tsx`)
- Utility files: `kebab-case.ts` for helpers (e.g., `use-mobile.ts`, `utils.ts`, `constants.ts`)
- Route files: `kebab-case.tsx` with TanStack naming convention (e.g., `_authenticated.tsx`, `dashboard.tsx`, `index.tsx`)
- Directory names: `kebab-case` (e.g., `components/ui`, `components/layout`, `components/providers`)
- Convex files: `kebab-case.ts` grouped by entity (e.g., `orgs/get.ts`, `customers/crud.ts`, `workos/storeOrg.ts`)

**Functions:**
- React components: `PascalCase` (e.g., `CustomersPage`, `MainLayout`, `ThemeProvider`)
- Utility functions: `camelCase` (e.g., `useIsMobile`, `cn`, `getMyOrg`)
- Event handlers: `handleActionName` (e.g., `handleCreateCustomer`, `handleDeleteCustomer`, `handleSubmit`)
- Query/mutation functions: `camelCase` with action verb (e.g., `listCustomers`, `createCustomer`, `deleteCustomer`, `getMyOrg`)

**Variables:**
- `camelCase` for all local variables, props, and state (e.g., `searchQuery`, `isCreateOpen`, `customerToDelete`)
- Constants: `CONSTANT_CASE` for module-level constants (e.g., `MOBILE_BREAKPOINT`, `BLOG_URL`, `DOCS_URL`)
- Boolean flags: `is*` prefix (e.g., `isLoading`, `isSubmitting`, `isAuthenticated`)
- UI state: `use*` prefix for useState (e.g., `[name, setName]`, `[isOpen, setIsOpen]`)

**Types:**
- Interface names: `PascalCase` (e.g., `MainLayoutProps`)
- Type names: `PascalCase` with descriptive suffixes (e.g., `VariantProps<typeof buttonVariants>`)
- Index signatures and utility types: Descriptive and clear (e.g., `Record<string, any>`, `Partial<typeof customer>`)

## Code Style

**Formatting:**
- Uses `prettier` for automatic formatting (configured in package.json)
- Command: `npm run format` (formats entire codebase)
- Line width: Prettier defaults (typically 80-88 characters)
- Quotes: Double quotes in JSX/HTML content (e.g., `"button"` in React)
- Semicolons: Always present in TypeScript/JavaScript

**Linting:**
- ESLint with TanStack config (`@tanstack/eslint-config`) and Convex plugin (`@convex-dev/eslint-plugin`)
- Config file: `eslint.config.mjs` (ESM format using flat config)
- Command: `npm run lint` enforces strict rules including `--max-warnings 0`
- Key rules:
  - No unused variables allowed
  - TypeScript strict mode enforced
  - No disabled directives allowed in production code
  - Convex-specific rules for function declarations

**Indentation:**
- 2 spaces per indentation level (Prettier default)
- Consistent across TypeScript, JSX, and CSS

## Import Organization

**Order:**
1. External packages (e.g., `import * as React from "react"`, `import { createFileRoute } from '@tanstack/react-router'`)
2. UI library imports (e.g., `import { Button } from "@/components/ui/button"`)
3. Internal components (e.g., `import { MainLayout } from "@/components/layout/main-layout"`)
4. API/Convex imports (e.g., `import { api } from "../../../convex/_generated/api"`)
5. Icons/utils (e.g., `import { Plus, Building2 } from 'lucide-react'`, `import { useState } from 'react'`)

**Path Aliases:**
- `@/*` resolves to `./src/*` (primary alias)
- `~/*` resolves to `./src/*` (alternative, rarely used)
- Configured in `tsconfig.json` under `compilerOptions.paths`
- Used consistently: `@/components/ui/button`, `@/lib/utils`, `@/components/layout/main-layout`

**Import Styles:**
- Use named imports by default: `import { Button } from "@/components/ui/button"`
- Wildcard imports for namespacing: `import * as React from "react"`
- Type imports for TypeScript types: `import type { Id } from "../_generated/dataModel"`

## Error Handling

**Patterns:**
- Convex functions throw `ConvexError` for user-facing errors:
  ```typescript
  if (!user) {
    throw new ConvexError("Not authenticated");
  }
  ```
- Authentication checks appear first in handlers (early exit pattern)
- Permission checks after auth: verify `role` against allowed roles
- Resource existence checks: return `null` from queries if not found, throw from mutations
- Access control: throw `ConvexError("Access denied")` with specific reason when possible
- Validation: use Convex schema validators (`v.string()`, `v.id()`) in args

**Error Messages:**
- User-facing: concise and actionable (e.g., "Customer limit reached. Maximum 10 customers allowed on your plan. Upgrade to add more.")
- Technical: include context (e.g., "Access denied - not assigned to this customer")
- Include limits in messages when applicable (usage errors)

**No Try-Catch Currently:**
- Error handling relies on schema validation and early returns
- No runtime error boundaries detected in frontend code
- Future: consider error boundaries for React components

## Logging

**Framework:** `console.*` (browser/Node console)

**Patterns:**
- Debug logs in development files only (not committed)
- Console usage in Convex functions for troubleshooting:
  ```typescript
  console.log("Input:", args)
  console.log("User:", ctx.auth?.userId)
  ```
- React DevTools extension for component inspection
- Convex dashboard logs for function debugging

**When to Log:**
- During development for debugging function logic
- Not for production tracing (consider Sentry/Posthog later)

## Comments

**When to Comment:**
- JSDoc comments on exported functions explain purpose, args, and behavior:
  ```typescript
  /**
   * List all customers for the current user's org
   * Respects role-based access (Admin sees all, Staff sees assigned, Client sees own)
   */
  export const listCustomers = query({...})
  ```
- Complex role-based logic explained inline
- Temporary workarounds documented with context:
  ```typescript
  // For now, let the component handle org checking
  // In production, you'd want to check Convex here and redirect to /onboarding if needed
  return { user };
  ```
- Schema comments explain field purpose and relationships (in `schema.ts`)

**JSDoc/TSDoc:**
- Used for exported queries/mutations with clear purpose
- Parameter descriptions included for complex args
- Not verbose for obvious utility functions (e.g., `cn()` helper is self-explanatory)

## Function Design

**Size:**
- Aim for focused, single-responsibility functions
- Large components (300+ lines) split into smaller sub-components:
  - `CustomersPage` (main logic) with `CreateCustomerForm` sub-component
  - `DashboardPage` with `StatCard`, `QuickActionButton`, `UsageBar` sub-components
- Convex functions typically 40-100 lines with nested auth/permission checks

**Parameters:**
- Prefer destructured objects for multiple args:
  ```typescript
  function MainLayout({ children, breadcrumbs }: MainLayoutProps) {...}
  ```
- Type props with interfaces: `MainLayoutProps`, `StatCardProps`
- Convex mutation args validated by schema: `args: { name: v.string(), email: v.optional(v.string()) }`

**Return Values:**
- React components return `JSX.Element` or `ReactNode`
- Queries return typed data or `null` if not found
- Mutations return ID or created/updated entity: `return customerId`
- Server functions return typed objects: `return { userId, token }`

## Module Design

**Exports:**
- One main export per file (typically)
- Named exports for utilities: `export function cn(...)`, `export const BLOG_URL = ...`
- Route exports: `export const Route = createFileRoute(...)`
- Component exports: `export function MainLayout(...)`, `export { Button, buttonVariants }`

**Barrel Files:**
- Not currently used (direct imports preferred)
- UI components use barrel pattern in generated files (e.g., `ui/button.tsx` exports both `Button` and `buttonVariants`)

**File Organization:**
- One component per file
- Co-located utilities with component if used only there
- Shared utilities in `lib/` or `hooks/`
- Convex functions grouped by entity in directories: `orgs/`, `customers/`, `users/`, `workos/`

## State Management

**Frontend:**
- React local state with `useState` for form inputs and UI state
- Convex React hooks for server state: `useQuery`, `useMutation`
- TanStack Router for navigation state: `useNavigate`, `Route.useLoaderData()`
- No Redux/Zustand (not needed for current architecture)

**Backend (Convex):**
- No client-side state persistence beyond localStorage (theme preference)
- Server-side auth tokens managed by WorkOS authkit
- Convex WebSocket syncs data in real-time

## TypeScript Usage

**Strict Mode:**
- `strict: true` in `tsconfig.json`
- `strictNullChecks: true` enforced
- No implicit `any` types
- Type guards used: `filter((c): c is NonNullable<typeof c> => c !== null)`

**Type Annotations:**
- React component props explicitly typed with interfaces
- Function return types annotated: `: Query<typeof api.customers.crud.listCustomers>`
- No type inference only when obvious (rarely)

---

*Convention analysis: 2026-02-09*
