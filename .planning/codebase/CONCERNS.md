# Codebase Concerns & Technical Debt

> **Document Purpose:** Track technical debt, known issues, security concerns, and areas needing attention.
>
> **Last Updated:** 2026-02-10

---

## Table of Contents

- [Critical Issues](#critical-issues)
- [TODO/FIXME Comments Found](#todofixme-comments-found)
- [Type Safety Issues](#type-safety-issues)
- [Security Concerns](#security-concerns)
- [Error Handling Issues](#error-handling-issues)
- [Incomplete Features](#incomplete-features)
- [Performance Concerns](#performance-concerns)
- [Architecture Smells](#architecture-smells)
- [Dependency Concerns](#dependency-concerns)

---

## Critical Issues

### 1. Billing Integration Incomplete (BLOCKING)

**Location:** `src/routes/_authenticated/billing.tsx`, `convex/polar.ts`

**Issue:** Polar billing is not fully configured with actual product IDs.

```bash
# Convex environment variables
POLAR_PRO_MONTHLY_PRODUCT_ID=product_xxx
POLAR_PRO_YEARLY_PRODUCT_ID=product_yyy
POLAR_BUSINESS_MONTHLY_PRODUCT_ID=product_zzz
POLAR_BUSINESS_YEARLY_PRODUCT_ID=product_aaa
```

**Impact:** Users cannot actually upgrade to paid plans. The checkout flow will fail.

**Required Action:**

1. Create products in the Polar dashboard
2. Set the product IDs in the Convex environment
3. Configure `VITE_POLAR_SERVER` for optional UI hints

---

### 2. Webhook Secret Configuration Missing

**Location:** `convex/webhooks/workos.ts:71`, `convex/http.ts`

**Issue:** Webhook handlers check for secrets at runtime but don't fail gracefully during development.

```typescript
// convex/webhooks/workos.ts:71-75
const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.error('WORKOS_WEBHOOK_SECRET not configured');
  return new Response('Webhook secret not configured', { status: 500 });
}
```

**Impact:** Webhook endpoints return 500 errors instead of being disabled when not configured.

---

## TODO/FIXME Comments Found

| Location | Line | Comment                  |
| -------- | ---- | ------------------------ |
| —        | —    | No billing TODOs tracked |

---

## Type Safety Issues

### 1. Widespread `as any` Usage

**Locations:** Multiple files

**Pattern:** Type assertions bypassing TypeScript's type checking:

```typescript
// src/routes/_authenticated/customers.tsx:76
await deleteCustomer({ customerId: customerToDelete as any });

// src/routes/_authenticated/customers/$customerId.tsx:24
const customer = useQuery(api.customers.crud.getCustomer, { customerId: customerId as any });

// src/routes/_authenticated/customers/$customerId.tsx:32-33
const assignedStaff = useQuery(api.assignments.queries.listAssignedStaff, { customerId: customerId as any });
const availableStaff = useQuery(api.assignments.queries.listAvailableStaff, { customerId: customerId as any });

// src/routes/_authenticated/customers/$customerId.tsx:62
customerId: customerId as any,

// src/routes/_authenticated/customers/$customerId.tsx:76-77
customerId: customerId as any,
userId: staffUserId as any,

// src/routes/_authenticated/customers/$customerId.tsx:87-88
customerId: customerId as any,
userId: staffUserId as any,

// src/router.tsx:9
const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;

// convex/polar.ts:27
      .withIndex('by_workos_user_id', (q: any) => q.eq('workosUserId', identity.subject))

// convex/workos/updateOrg.ts:33
const updateData: any = { ... };

// convex/orgs/update.ts:12
const updates: Record<string, any> = { ... };
```

**Impact:**

- Loss of type safety for critical ID parameters
- Potential runtime errors from mismatched types
- Difficult refactoring (TypeScript won't catch breaking changes)

**Root Cause:** Route params from TanStack Router are typed as `string`, but Convex expects `Id<"table">` types.

**Recommended Fix:** Create a type-safe wrapper for route params or use proper type guards.

---

### 2. Route Tree Generated Code Using `as any`

**Location:** `src/routeTree.gen.ts:28-79`

```typescript
} as any)
} as any)
// ... multiple instances
```

**Note:** This is auto-generated code, but the pattern suggests potential type issues in the route configuration.

---

## Security Concerns

### 1. No Rate Limiting on Public Endpoints

**Location:** `convex/webhooks/workos.ts`, `convex/http.ts`

**Issue:** Webhook endpoints have no rate limiting, making them vulnerable to:

- DDoS attacks
- Webhook flooding
- Resource exhaustion

**Current Code:**

```typescript
// convex/webhooks/workos.ts:58
export const handleWorkOSWebhook = httpAction(async (ctx, request) => {
  // No rate limiting
  // ...
});
```

**Recommendation:** Implement rate limiting using Convex's built-in mechanisms or a token bucket approach.

---

### 2. Timing Attack Vulnerability in Webhook Verification

**Location:** `convex/webhooks/workos.ts:47`

**Issue:** Signature comparison is not constant-time:

```typescript
// convex/webhooks/workos.ts:46-47
// Compare signatures (constant-time comparison would be better, but this is acceptable)
return computedSig === expectedSig;
```

**Impact:** Potential timing attack vulnerability allowing attackers to forge webhook signatures.

**Note:** The comment acknowledges this is a known issue marked as "acceptable" for the current implementation.

---

### 3. Environment Variable Validation Missing

**Location:** `src/router.tsx:8-12`, `convex/auth.config.ts:3`

**Issue:** Runtime validation of critical environment variables is minimal:

```typescript
// src/router.tsx:8-12
const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
if (!CONVEX_URL) {
  throw new Error('missing VITE_CONVEX_URL env var');
}

// convex/auth.config.ts:3
const clientId = process.env.WORKOS_CLIENT_ID;
// No validation - used directly in JWKS URL construction
```

**Impact:**

- Cryptic errors at runtime
- Potential security issues if malformed values are used

---

### 4. CORS Policy Not Explicitly Configured

**Issue:** No explicit CORS configuration found for webhook endpoints. Convex defaults may be insufficient.

---

## Error Handling Issues

### 1. Console Error Logging Instead of User Feedback

**Locations:** Multiple files

**Pattern:** Errors are logged to console but not shown to users:

```typescript
// src/routes/_authenticated/billing.tsx:99-100
try {
  await cancelSubscription({});
  // ...
} catch (error) {
  console.error('Failed to cancel subscription:', error);
}

// src/routes/_authenticated/team.tsx:42-43
try {
  await removeUser({ userId });
} catch (error) {
  console.error('Failed to remove user:', error);
}

// src/routes/_authenticated/customers/$customerId.tsx:79-80
try {
  await assignStaffMutation({ ... });
} catch (error) {
  console.error('Failed to assign staff:', error);
}
```

**Impact:** Users see no feedback when operations fail, leading to:

- Confusion about whether actions succeeded
- Repeated failed attempts
- Poor UX

---

### 2. Generic Error Component Exposes Stack Traces

**Location:** `src/router.tsx:32`

```typescript
defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
```

**Issue:** Stack traces are exposed to end users in production.

**Security Impact:** Information disclosure - stack traces can reveal:

- File paths
- Code structure
- Internal implementation details

---

### 3. Error Handling in Mutation Hooks Inconsistent

**Issue:** Some mutations have error handling, others don't:

```typescript
// src/routes/_authenticated/customers.tsx:304-311
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes('limit reached') || errorMessage.includes('Customer limit')) {
    setLimitError(true);
  } else {
    throw error;  // Re-throws some errors
  }
}
```

**Impact:** Inconsistent error handling patterns across the codebase.

---

## Incomplete Features

### 1. Toast/Notification System Missing

**Issue:** Multiple TODO comments indicate a toast system is planned but not implemented:

```typescript
// src/routes/_authenticated/billing.tsx:97-98
// Show success feedback (console for now, toast in future)
console.log('Subscription cancelled successfully');
```

**Impact:** No user feedback for async operations.

---

### 2. Numbers Table from Template Still Exists

**Location:** `convex/schema.ts:118-121`

```typescript
// Temporary: Keep numbers table from template until fully migrated
numbers: defineTable({
  value: v.number(),
}),
```

**Impact:** Unused table cluttering the schema.

---

### 3. Free Tier Hardcoded in Multiple Places

**Locations:** `convex/billing/plans.ts`, `src/config/billing.ts`

**Issue:** Free tier limits are defined in both backend and frontend:

```typescript
// convex/billing/plans.ts:1-5
export const FREE_TIER_LIMITS = {
  maxCustomers: 3,
  maxStaff: 2,
  maxClients: 10,
} as const;

// src/routes/_authenticated/billing.tsx:37-48
Free: {
  name: 'Free',
  // ... duplicating the same limits
  limits: { maxCustomers: 3, maxStaff: 2, maxClients: 10 },
},
```

**Impact:** Risk of synchronization issues between frontend and backend limits.

---

## Performance Concerns

### 1. No Query Caching Strategy

**Location:** `src/router.tsx:16-24`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
      gcTime: 5000, // Very short cache time
    },
  },
});
```

**Issue:** `gcTime: 5000` (5 seconds) is extremely short, potentially causing:

- Excessive re-fetching
- Unnecessary network traffic
- Poor perceived performance

---

### 2. Multiple Parallel Queries Without Batching

**Locations:** Various route components

**Pattern:** Components fetch multiple queries in parallel:

```typescript
// src/routes/_authenticated/billing.tsx:81-83
const usageStats = useQuery(api.billing.queries.getUsageStats);
const billingInfo = useQuery(api.billing.queries.getBillingInfo);
const org = useQuery(api.orgs.get.getMyOrg);
```

**Impact:** Multiple round trips to the server instead of batched requests.

---

### 3. No Pagination on List Queries

**Locations:** `convex/customers/crud.ts`, `convex/users/queries.ts`

**Issue:** List queries return all records:

```typescript
// convex/customers/crud.ts:55-60
const customers = await ctx.db
  .query('customers')
  .withIndex('by_org', (q) => q.eq('orgId', user.orgId))
  .collect(); // Returns ALL customers
```

**Impact:** Performance degradation as data grows. No upper bound on result set size.

---

## Architecture Smells

### 1. Role Checking Duplicated Across Functions

**Pattern:** Every Convex function repeats the same auth checks:

```typescript
// Pattern repeated in ~20+ files:
const user = await ctx.db
  .query('users')
  .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
  .unique();

if (!user) {
  throw new ConvexError('User record not found');
}

if (user.role !== 'admin') {
  throw new ConvexError('Admin role required');
}
```

**Impact:**

- Code duplication
- Inconsistent error messages
- Hard to maintain (change auth logic in 20+ places)

**Recommendation:** Create a centralized auth helper (as documented in SECURITY.md but not implemented).

---

### 2. Client-Side Role Checks

**Location:** `src/routes/_authenticated/customers/$customerId.tsx:28-29`

```typescript
const userInfo = useQuery(api.orgs.get.hasOrg);
const isAdmin = userInfo?.role === 'admin';
```

**Issue:** Role checks are performed on the client side to conditionally render UI.

**Security Note:** This is acceptable only if the server validates permissions on every mutation/query (which it does), but it's brittle.

---

### 3. Magic Strings for Error Messages

**Issue:** Error messages are hardcoded as strings throughout the codebase:

```typescript
throw new ConvexError('Not authenticated');
throw new ConvexError('Admin role required to send invitations');
throw new ConvexError('User not in organization');
```

**Impact:**

- Difficult to change or internationalize
- Prone to typos/inconsistencies
- Hard to programmatically handle specific errors

---

## Dependency Concerns

### 1. React 19 (Very New)

**Location:** `package.json:52-53`

```json
"react": "^19.2.4",
"react-dom": "^19.2.4",
```

**Issue:** React 19 was released recently (late 2024/early 2025). Some ecosystem packages may not be fully compatible.

**Risk:** Potential undiscovered bugs or compatibility issues with third-party libraries.

---

### 2. TanStack Router/Start (Rapidly Evolving)

**Location:** `package.json:41-43`

```json
"@tanstack/react-router": "^1.158.0",
"@tanstack/react-router-ssr-query": "^1.158.0",
"@tanstack/react-start": "^1.158.0",
```

**Issue:** TanStack Start is pre-1.0 stable and undergoing rapid development.

**Risk:** API changes, breaking changes in minor versions.

---

### 3. Tailwind CSS v4 (Beta/RC)

**Location:** `package.json:69`

```json
"tailwindcss": "^4.1.18",
```

**Issue:** Tailwind v4 was in beta/RC when this project was created.

**Risk:** Potential breaking changes or undocumented behavior.

---

### 4. radix-ui Monolith Package

**Location:** `package.json:51`

```json
"radix-ui": "^1.4.3",
```

**Issue:** The entire `radix-ui` package is imported instead of individual primitives like `@radix-ui/react-dialog`.

**Impact:** Potentially larger bundle size than necessary.

---

## Testing Debt

### 1. No Test Suite Implemented

**Evidence:** `TESTING.md` exists but contains only guidelines:

> **Note:** No test suite is currently implemented. Tests should be added as the project matures.

**Impact:**

- No regression protection
- Manual testing required for all changes
- Difficult to refactor safely

---

### 2. No E2E Tests for Critical Flows

**Missing Coverage:**

- User authentication flow
- Organization creation
- Customer CRUD operations
- Team invitation flow
- Billing/subscription flow

---

## Documentation Debt

### 1. WorkOS Webhook Handler Limited

**Location:** `convex/webhooks/workos.ts:56-57`

```typescript
/**
 * Handle WorkOS webhook events
 * Currently handles: invitation.accepted
 */
```

**Issue:** Only handles `invitation.accepted` event. Other important events are ignored:

- `user.created`
- `user.updated`
- `organization.updated`
- `organization.deleted`

---

### 2. API Documentation Out of Sync

**Risk:** As features are added quickly, API.md may not reflect actual implementation.

---

## Recommended Priority Order

### 🔴 Critical (Fix Immediately)

1. Replace placeholder variant IDs in billing configuration
2. Add user-facing error feedback (not just console logging)
3. Fix stack trace exposure in error component

### 🟠 High (Fix Soon)

4. Remove `as any` type assertions for ID parameters
5. Add rate limiting to webhook endpoints
6. Implement pagination for list queries
7. Create centralized auth helper to reduce duplication

### 🟡 Medium (Fix When Convenient)

8. Remove unused `numbers` table
9. Consolidate free tier limit definitions
10. Add proper CORS configuration
11. Implement toast/notification system

### 🟢 Low (Nice to Have)

12. Add constant-time signature comparison
13. Split radix-ui into individual packages
14. Add comprehensive test suite
15. Improve error message system (constants vs magic strings)

---

## Summary Statistics

| Category                                | Count |
| --------------------------------------- | ----- |
| TODO/FIXME Comments                     | 3     |
| `as any` Usages                         | 15+   |
| `console.error` Without User Feedback   | 8     |
| Webhook Endpoints Without Rate Limiting | 2     |
| Missing Environment Validations         | 3     |
| Incomplete Features                     | 3     |
| Security Concerns                       | 4     |
