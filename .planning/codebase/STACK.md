# Technology Stack

> Core technologies, frameworks, and development workflow for iSaaSIT.

## Languages and Runtimes

| Language/Runtime | Version            | Purpose                              |
| ---------------- | ------------------ | ------------------------------------ |
| **TypeScript**   | 5.9.3              | Primary language for all source code |
| **Node.js**      | 22.x (via Netlify) | Server runtime for SSR and build     |
| **Deno**         | (via Convex)       | Convex function runtime              |
| **ES2022**       | Target             | JavaScript compilation target        |

### TypeScript Configuration

- **Config:** `tsconfig.json`
- **Module:** ESNext with Bundler resolution
- **Strict mode:** Enabled (strictNullChecks, strict)
- **Path aliases:**
  - `@/*` → `./src/*`
  - `~/*` → `./src/*`

## Core Frameworks and Libraries

### Frontend Stack

| Framework/Library        | Version | Purpose                             |
| ------------------------ | ------- | ----------------------------------- |
| **React**                | 19.2.4  | UI component library                |
| **React DOM**            | 19.2.4  | DOM rendering                       |
| **TanStack Start**       | 1.158.0 | Full-stack React framework with SSR |
| **TanStack Router**      | 1.158.0 | File-based routing                  |
| **TanStack React Query** | 5.90.20 | Server state management             |

### Backend Stack

| Framework/Library           | Version | Purpose                          |
| --------------------------- | ------- | -------------------------------- |
| **Convex**                  | 1.31.7  | Serverless backend platform      |
| **@convex-dev/react-query** | 0.1.0   | Convex + React Query integration |

### Styling

| Framework/Library            | Version | Purpose                        |
| ---------------------------- | ------- | ------------------------------ |
| **Tailwind CSS**             | 4.1.18  | Utility-first CSS framework    |
| **@tailwindcss/postcss**     | 4.1.18  | PostCSS plugin for Tailwind v4 |
| **tw-animate-css**           | 1.4.0   | Animation utilities            |
| **class-variance-authority** | 0.7.1   | Component variant management   |
| **tailwind-merge**           | 3.4.0   | Tailwind class merging         |
| **clsx**                     | 2.1.1   | Conditional class utilities    |

### UI Components

| Framework/Library        | Version          | Purpose                  |
| ------------------------ | ---------------- | ------------------------ |
| **shadcn/ui**            | (new-york style) | Component library system |
| **Radix UI**             | 1.4.3            | Headless UI primitives   |
| **@radix-ui/react-slot** | 1.2.4            | Slot component primitive |
| **lucide-react**         | 0.563.0          | Icon library             |

### Date Handling

| Library      | Version | Purpose                     |
| ------------ | ------- | --------------------------- |
| **date-fns** | 4.1.0   | Date manipulation utilities |

## Build Tools and Configuration

### Vite Configuration

**File:** `vite.config.ts`

```typescript
// Key plugins:
- vite-tsconfig-paths      // TypeScript path resolution
- @tanstack/react-start/plugin/vite  // TanStack Start
- @netlify/vite-plugin-tanstack-start // Netlify SSR adapter
- @vitejs/plugin-react     // React Fast Refresh
```

**Server:** Port 3000 (development)

### PostCSS Configuration

**File:** `postcss.config.mjs`

```javascript
// Single plugin:
- @tailwindcss/postcss   // Tailwind CSS v4 processing
```

### ESLint Configuration

**File:** `eslint.config.mjs`

- Extends `@tanstack/eslint-config`
- Includes `@convex-dev/eslint-plugin`
- Ignores: `convex/_generated`, `routeTree.gen.ts`

### Prettier Configuration

**File:** `prettier.config.mjs`

- Single quotes
- Trailing commas (all)
- Print width: 120
- Semicolons: true

## Package.json Dependencies Overview

### Production Dependencies (18 packages)

```json
// Core Framework
"@tanstack/react-start": "^1.158.0"
"@tanstack/react-router": "^1.158.0"
"react": "^19.2.4"
"react-dom": "^19.2.4"

// State Management & Data
"@tanstack/react-query": "^5.90.20"
"@convex-dev/react-query": "^0.1.0"
"convex": "^1.31.7"

// Authentication
"@workos/authkit-tanstack-react-start": "0.5.0"
"@workos-inc/node": "^8.1.0"

// Billing
"@convex-dev/polar": "^0.1.0"

// UI & Styling
"tailwindcss": "^4.1.18"
"tailwind-merge": "^3.4.0"
"class-variance-authority": "^0.7.1"
"clsx": "^2.1.1"
"lucide-react": "^0.563.0"
"radix-ui": "^1.4.3"
"@radix-ui/react-slot": "^1.2.4"
"tw-animate-css": "^1.4.0"

// Utilities
"date-fns": "^4.1.0"
```

### Development Dependencies (15 packages)

```json
// Build Tools
"vite": "^7.3.1"
"typescript": "^5.9.3"
"@vitejs/plugin-react": "^5.1.3"
"vite-tsconfig-paths": "^6.0.5"

// Netlify Integration
"@netlify/vite-plugin-tanstack-start": "^1.2.8"

// Tailwind v4
"@tailwindcss/postcss": "^4.1.18"

// Linting & Formatting
"@tanstack/eslint-config": "^0.3.4"
"@convex-dev/eslint-plugin": "^1.1.1"
"prettier": "^3.8.1"
"eslint": "(from @tanstack/eslint-config)"

// Type Definitions
"@types/node": "^24.10.10"
"@types/react": "^19.2.10"
"@types/react-dom": "^19.2.3"

// Dev Utilities
"dotenv": "^17.2.3"
"npm-run-all2": "^8.0.4"

// Debug Tools
"@tanstack/react-router-devtools": "^1.158.0"
```

## Development Workflow

### NPM Scripts

```bash
# Development (runs frontend + backend in parallel)
npm run dev

# Individual development servers
npm run dev:frontend      # Vite dev server (port 3000)
npm run dev:backend       # Convex dev server
npm run dev:all           # Frontend + backend + docs

# Documentation	npm run dev:docs          # Astro dev server (port 4321)

# Building
npm run build             # Production build (Vite)
npm run build:docs        # Build docs site
npm run build:combined    # Build app + docs together

# Preview
npm run start             # Start production server
npm run preview:docs      # Preview built docs

# Code Quality
npm run lint              # Type check + ESLint
npm run format            # Prettier formatting

# Setup
npm run setup             # Project setup
npm run postinstall       # Post-install hooks
```

### File Structure

```
src/
├── routes/                    # TanStack Router file-based routes
│   ├── __root.tsx            # Root layout with auth setup
│   ├── index.tsx             # Home page
│   ├── callback.tsx          # WorkOS OAuth callback
│   ├── _authenticated.tsx    # Protected route layout
│   └── _authenticated/       # Protected pages
│       ├── dashboard.tsx
│       ├── billing.tsx
│       ├── customers.tsx
│       ├── team.tsx
│       └── settings.tsx
├── components/
│   └── ui/                   # shadcn/ui components (25 components)
├── router.tsx                # Router configuration
├── start.ts                  # TanStack Start entry
└── app.css                   # Global styles (Tailwind v4)

convex/
├── schema.ts                 # Database schema
├── auth.config.ts            # JWT auth configuration
├── http.ts                   # HTTP routes/webhooks
├── myFunctions.ts            # Example functions
├── _generated/               # Auto-generated types
└── [feature]/                # Feature-organized functions
    ├── queries.ts
    ├── mutations.ts
    └── actions.ts
```

### Key Conventions

1. **Routing:** File-based with TanStack Router
   - `index.tsx` → `/`
   - `_authenticated.tsx` → Layout wrapper
   - `$param.tsx` → Dynamic routes

2. **Convex Functions:** Organized by feature
   - `query` - Read operations
   - `mutation` - Write operations
   - `action` - External API calls

3. **Components:** shadcn/ui pattern
   - Use `class-variance-authority` for variants
   - Tailwind for styling
   - Radix UI for primitives

4. **Styling:** Tailwind CSS v4
   - CSS-first configuration in `app.css`
   - OKLCH color format
   - CSS variables for theming
   - Dark mode support via `prefers-color-scheme`

## Documentation Site Stack

Located in `docs/` directory:

| Technology             | Version | Purpose               |
| ---------------------- | ------- | --------------------- |
| **Astro**              | 5.6.1   | Static site generator |
| **Starlight**          | 0.37.6  | Documentation theme   |
| **@astrojs/starlight** | 0.37.6  | Starlight integration |
| **@astrojs/tailwind**  | 6.0.2   | Tailwind integration  |
| **@astrojs/sitemap**   | 3.7.0   | Sitemap generation    |
| **starlight-blog**     | 0.25.2  | Blog plugin           |
| **sharp**              | 0.34.2  | Image optimization    |

**Dev Port:** 4321

**Build Output:** `dist/client/docs/`
