# External Integrations

**Analysis Date:** 2026-02-09

## APIs & External Services

**Authentication & Identity:**
- WorkOS - Enterprise authentication, SSO, user management
  - SDK/Client: @workos/authkit-tanstack-react-start 0.5.0 (frontend), @workos-inc/node 8.1.0 (backend)
  - Auth: Environment variables WORKOS_CLIENT_ID and WORKOS_API_KEY
  - Endpoints: https://api.workos.com/, https://api.workos.com/sso/jwks/{clientId}
  - Functions: `src/start.ts` (middleware), `src/routes/callback.tsx` (OAuth callback handler)
  - Backend integration: `convex/auth.config.ts` (JWT token validation)

**Billing & Payments (Planned):**
- Lemon Squeezy - Payment processing and subscription management
  - Referenced in: `convex/schema.ts` (subscriptionId, subscriptionStatus fields on orgs table)
  - Webhook endpoint planned: POST /webhooks/lemon-squeezy (documented in API.md)
  - Webhook handler pattern: Signature validation via x-signature header, webhook event parsing, internal mutation invocation
  - Not fully implemented yet (schema prepared, webhook structure defined, but handler code not present)

## Data Storage

**Primary Database:**
- Convex - Backend-as-a-Service with built-in database and real-time sync
  - Connection: Via environment variable VITE_CONVEX_URL (cloud deployment URL)
  - Client: convex/react for frontend queries/mutations, convex/server for backend server-side functions
  - Location: `convex/schema.ts` defines all tables:
    - `orgs` - Organizations (multi-tenant root, synced from WorkOS with Lemon Squeezy subscription data)
    - `users` - User profiles (extends WorkOS user data with app-specific fields like role and org membership)
    - `customers` - Client companies managed by organizations
    - `staffCustomerAssignments` - Maps staff to customers they can access
    - `numbers` - Temporary table from template
  - Indexes: Defined on all tables for common queries (by_org, by_workos_user_id, by_subscription_id, etc.)

**File Storage:**
- Not detected - Local filesystem only (no S3, CloudFront, or similar)

**Caching:**
- TanStack React Query 5.90.20 - Client-side cache for Convex data
- Convex built-in real-time sync - Automatic subscription management and cache invalidation
- No explicit Redis or memcached

## Authentication & Identity

**Auth Provider:**
- WorkOS (Enterprise auth provider)
  - Implementation:
    - Frontend: @workos/authkit-tanstack-react-start provides AuthKitProvider, useAuth hook, and middleware
    - Backend: Custom JWT validation via RS256 public key from WorkOS JWKS endpoint
    - Middleware: `src/start.ts` applies authkitMiddleware() to all requests
    - Protected routes: `src/routes/_authenticated.tsx` enforces authentication
  - Token validation: Convex auth.config.ts validates two JWT issuers from WorkOS
  - SSO: Configurable via WorkOS dashboard, supports SAML/OIDC
  - Redirect URIs: dev=http://localhost:3000/callback, prod=https://${VERCEL_PROJECT_PRODUCTION_URL}/callback

**Session Management:**
- WORKOS_COOKIE_PASSWORD (32+ chars) - Encrypts session cookies
- Cookies set by authkitMiddleware and validated on each request
- Session data includes: user identity, organization, role

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, LogRocket, or similar

**Logs:**
- console.* for development (no structured logging detected)
- Convex dashboard for backend error logs
- Netlify logs for deployment/HTTP errors

## CI/CD & Deployment

**Hosting:**
- Netlify - Primary deployment platform via .netlify/netlify.toml
  - Build command: npm run build:combined
  - Publish directory: dist/client
  - SSR: Handled by @netlify/vite-plugin-tanstack-start (Netlify Functions)

**Backend Hosting:**
- Convex Cloud - Managed BaaS hosting (convex dev for local, deployed via Convex CLI)

**CI Pipeline:**
- Not detected in codebase - No GitHub Actions, GitLab CI, or CircleCI config
- Assumes manual deployment or Git push triggers via Netlify

## Environment Configuration

**Required environment vars:**
```
# WorkOS
WORKOS_CLIENT_ID=client_your_client_id_here
WORKOS_API_KEY=sk_test_your_api_key_here
WORKOS_COOKIE_PASSWORD=your_secure_password_here_must_be_at_least_32_characters_long
WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Convex
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

**Optional vars:**
- None detected explicitly, but development/preview/prod environments have conditional config in convex.json

**Secrets location:**
- `.env.local` (git-ignored) for development
- Environment variable UI in Netlify deployment settings for production
- Convex dashboard for backend secrets
- WorkOS dashboard for API keys and app settings

## Webhooks & Callbacks

**Incoming Webhooks:**
- POST /webhooks/lemon-squeezy - Lemon Squeezy webhook endpoint (planned but not fully implemented)
  - Expected headers: x-signature for HMAC validation
  - Expected body: JSON with meta.event_name and data fields
  - Handler: Signature validation → event parsing → internal mutation dispatch
  - Implementation location: Convex HTTP action (not yet visible in codebase)

**Outgoing Webhooks:**
- None detected
- Convex can invoke external HTTP requests via ctx.fetch() in actions (pattern shown in comments in convex/myFunctions.ts)

## OAuth & Third-Party Auth Flows

**WorkOS OAuth 2.0:**
- Authorization endpoint: WorkOS dashboard configurable
- Redirect URI: WORKOS_REDIRECT_URI env var (http://localhost:3000/callback for dev)
- Handler: `src/routes/callback.tsx` - Calls handleCallbackRoute from authkitMiddleware
- Exchange: authkitMiddleware handles code exchange and session creation
- Scopes: Default WorkOS scopes (email, profile, org membership)

## Real-Time Features

**Convex Real-Time Sync:**
- useQuery() - Subscribes to live data from database
- useMutation() - Sends changes that trigger automatic cache invalidation
- Location: Extensively used in routes (`src/routes/_authenticated/*.tsx`)
- Examples: `src/routes/_authenticated/customers.tsx`, `src/routes/_authenticated/dashboard.tsx`

## Data Synchronization

**WorkOS → Convex Sync:**
- One-directional: WorkOS is source of truth for users and org membership
- Sync points:
  - On login: `src/routes/_authenticated.tsx` may fetch updated user data
  - On org creation: `convex/workos/createOrg.ts` creates WorkOS org, then stores in Convex
  - On org update: Similar pattern in `convex/workos/updateOrg.ts`
- No webhook-based sync detected (manual sync on user actions)

**Lemon Squeezy → Convex Sync (Planned):**
- Webhook-based: Lemon Squeezy posts to /webhooks/lemon-squeezy
- Sync events: order.created, subscription.created, subscription.updated, subscription.cancelled
- Target fields: subscriptionId, subscriptionStatus, planId, maxCustomers, maxStaff, maxClients on orgs table

---

*Integration audit: 2026-02-09*
