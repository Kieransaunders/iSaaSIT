# External Integrations

> Third-party services, APIs, and webhook endpoints used by iSaaSIT.

## Authentication Provider

### WorkOS AuthKit

**Primary Auth Provider** - Enterprise-grade authentication platform

| Aspect         | Details                                         |
| -------------- | ----------------------------------------------- |
| **Service**    | WorkOS AuthKit                                  |
| **SDK**        | `@workos/authkit-tanstack-react-start` (v0.5.0) |
| **Node SDK**   | `@workos-inc/node` (v8.1.0)                     |
| **Protocol**   | OAuth 2.0 + JWT                                 |
| **Token Type** | RS256 signed JWT                                |

**Configuration Files:**

- `convex/auth.config.ts` - JWT validation configuration
- `convex.json` - AuthKit deployment settings (dev/preview/prod)

**Environment Variables:**

```bash
WORKOS_CLIENT_ID=client_xxx
WORKOS_API_KEY=sk_test_xxx
WORKOS_COOKIE_PASSWORD=xxx  # Min 32 chars
WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

**Features Used:**

- OAuth/OIDC authentication
- Organization management
- User invitations
- Role-based access (Admin, Staff, Client)
- JWT token validation via JWKS

**Integration Points:**

- `src/routes/__root.tsx` - AuthKitProvider setup
- `src/routes/callback.tsx` - OAuth callback handler
- `src/routes/_authenticated.tsx` - Protected route guard
- `convex/auth.config.ts` - Convex JWT validation
- `convex/workos/` - WorkOS organization sync
- `convex/webhooks/workos.ts` - WorkOS webhooks

**JWKS Endpoint:**

```
https://api.workos.com/sso/jwks/${WORKOS_CLIENT_ID}
```

## Database and Storage

### Convex

**Primary Database** - Serverless reactive database

| Aspect                | Details                                     |
| --------------------- | ------------------------------------------- |
| **Service**           | Convex (convex.dev)                         |
| **Client SDK**        | `convex` (v1.31.7)                          |
| **React Integration** | `@convex-dev/react-query` (v0.1.0)          |
| **Language**          | TypeScript (transpiled to Deno)             |
| **Model**             | Document store with real-time subscriptions |

**Configuration:**

- `convex.json` - Deployment configuration
- `convex/schema.ts` - Database schema definition

**Environment Variable:**

```bash
VITE_CONVEX_URL=https://xxx.convex.cloud
```

**Schema Tables:**

```typescript
// convex/schema.ts
- orgs              # Organizations with billing data
- customers         # Client companies
- users             # User profiles with roles
- staffCustomerAssignments  # Access control mapping
- pendingInvitations # WorkOS invitation tracking
- numbers           # Template data (temporary)
```

**Convex Function Types:**

- **Queries** - Read operations (cached, realtime)
- **Mutations** - Write operations (transactional)
- **Actions** - External API calls (HTTP)
- **HTTP Routes** - Webhook endpoints

**Feature Modules:**

```
convex/
├── assignments/     # Staff-customer assignments
├── billing/         # Subscription and billing
├── customers/       # Customer CRUD
├── invitations/     # User invitations
├── polar.ts         # Billing provider integration
├── orgs/            # Organization management
├── users/           # User management
├── webhooks/        # Webhook handlers
└── workos/          # WorkOS synchronization
```

## Billing and Payments

### Polar

**Payment Processor** - Subscription billing via Polar

| Aspect      | Details                         |
| ----------- | ------------------------------- |
| **Service** | Polar                           |
| **SDK**     | `@convex-dev/polar`             |
| **Model**   | Subscription-based SaaS billing |

**Integration Files:**

- `convex/polar.ts` - Polar client configuration
- `convex/billing/` - Billing queries and actions

**Webhook Endpoint:**

```
POST /polar/events
```

**Configuration:**

- Organization token and webhook secret in Convex env
- Product IDs mapped in `convex/polar.ts`

**Synced Data:**

- Subscription status
- Product metadata (maxCustomers, maxStaff, maxClients)
- Customer portal URLs
- Trial dates

## Webhook Endpoints

**File:** `convex/http.ts`

### 1. WorkOS Webhooks

```
POST /webhooks/workos
```

**Handler:** `convex/webhooks/workos.ts`

**Events Handled:**

- Organization created/updated
- User membership changes
- Invitation status updates

### 2. Polar Webhooks

```
POST /polar/events
```

**Handler:** `convex/http.ts` via `polar.registerRoutes`

**Events Handled:**

- Product created/updated
- Subscription created/updated

## Deployment and Hosting

### Netlify

**Primary Hosting Platform**

| Aspect                | Details                                        |
| --------------------- | ---------------------------------------------- |
| **Build Command**     | `npm run build:combined`                       |
| **Publish Directory** | `dist/client`                                  |
| **Node Version**      | 22.x                                           |
| **Plugin**            | `@netlify/vite-plugin-tanstack-start` (v1.2.8) |

**Configuration:** `netlify.toml`

**Features:**

- SSR function deployment
- Static asset serving
- Redirect rules for docs
- Cache headers

**Redirects:**

```
/docs/*      → Static docs files
/blog/*      → /docs/blog/*
```

### Convex Deployment

**Separate from Frontend**

```bash
npx convex deploy    # Deploy functions
npx convex dev       # Development mode
```

**Environments:**

- Dev: Local development with `convex dev`
- Preview: Branch deploys
- Prod: Production deployment

## External SDKs and Libraries

### Third-Party SDKs Summary

| Provider | SDK                                    | Version | Purpose            |
| -------- | -------------------------------------- | ------- | ------------------ |
| WorkOS   | `@workos/authkit-tanstack-react-start` | 0.5.0   | React integration  |
| WorkOS   | `@workos-inc/node`                     | 8.1.0   | Server-side API    |
| Polar    | `@convex-dev/polar`                    | 0.1.0   | Billing API        |
| Convex   | `convex`                               | 1.31.7  | Database client    |
| Convex   | `@convex-dev/react-query`              | 0.1.0   | React Query bridge |

### API Endpoints (External)

**WorkOS API:**

```
https://api.workos.com/
```

**Polar API:**

```
https://api.polar.sh/
```

**Convex API:**

```
https://{deployment-name}.convex.cloud
```

## Security Considerations

### Environment Variables (Required)

```bash
# WorkOS AuthKit
WORKOS_CLIENT_ID              # OAuth client ID
WORKOS_API_KEY                # API key (sk_test_ or sk_live_)
WORKOS_COOKIE_PASSWORD        # Cookie encryption (32+ chars)
WORKOS_REDIRECT_URI           # OAuth callback URL

# Convex
VITE_CONVEX_URL               # Convex deployment URL

# Polar (stored in Convex dashboard)
POLAR_ORGANIZATION_TOKEN      # Organization token
POLAR_WEBHOOK_SECRET          # Webhook signing secret
POLAR_SERVER                  # sandbox | production
POLAR_PRO_MONTHLY_PRODUCT_ID  # Product ID
POLAR_PRO_YEARLY_PRODUCT_ID   # Product ID
POLAR_BUSINESS_MONTHLY_PRODUCT_ID # Product ID
POLAR_BUSINESS_YEARLY_PRODUCT_ID  # Product ID
```

### Authentication Flow

1. User initiates login via WorkOS AuthKit
2. WorkOS redirects to `WORKOS_REDIRECT_URI` (`/callback`)
3. JWT token stored in cookie (encrypted with `WORKOS_COOKIE_PASSWORD`)
4. Convex validates JWT via JWKS on each request
5. User identity available in Convex functions via `ctx.auth.getUserIdentity()`

### Data Isolation

- Organization-level data isolation via `orgId`
- Role-based access (Admin/Staff/Client)
- Customer-level isolation for Client role
- Staff-customer assignments for selective access
