# Testing Patterns

**Analysis Date:** 2026-02-09

## Test Framework

**Runner:**
- No automated test framework currently configured
- Manual testing via browser during development
- Convex dashboard for function testing

**Assertion Library:**
- Not configured (no automated tests)

**Run Commands:**
```bash
npm run lint                    # Type check and lint (closest to test validation)
npm run build                   # Verify production build
npm run dev                     # Start development server with live reload
npm run format                  # Check code formatting compliance
```

## Test Philosophy

**Current State:**
- No automated unit/integration/E2E test suite implemented
- Intentional design choice for starter template (prioritizes speed to market)
- Safety nets in place: TypeScript strict mode, ESLint, schema validation

**When to Add Tests:**
- Project stabilizes (core features finalized)
- Team size grows (multiple developers)
- Critical paths identified (auth, billing, data mutations)
- Regression patterns emerge (same bugs appearing multiple times)

**Recommended Test Priority (when adding):**
1. Critical auth flows (sign in, role-based access)
2. Billing/payment flows (subscription status, usage limits)
3. Data mutation functions (CRUD operations with constraints)
4. Role-based access control (multi-tenancy isolation)

## Manual Testing Approach

**Development Testing Workflow:**

```bash
# 1. Start dev environment
npm run dev

# 2. Open browser and navigate
open http://localhost:3000

# 3. Test flows manually using browser
```

**Browser DevTools Testing:**
- **Network Tab**: Monitor Convex WebSocket connections, auth token refresh, API responses
- **React Query DevTools**: Included with `@convex-dev/react-query`, inspect cache behavior and query keys
- **Application Tab**: Inspect cookies (WorkOS session), localStorage (theme preference)
- **Console Tab**: Check for TypeScript errors, undefined references, ConvexError messages

## Convex Function Testing

**Testing via Dashboard:**

```bash
# Open Convex dashboard
npx convex dashboard
```

Navigate to:
- Functions tab → Select function → Run with test arguments → View results and logs

**Testing via CLI:**

```bash
# Run a query
npx convex run api.customers.crud:listCustomers

# Run a mutation with arguments
npx convex run api.customers.crud:createCustomer --json '{"name": "Test Org", "email": "test@example.com"}'

# Test internal function
npx convex run api.orgs.get:getMyOrgInternal --json '{"workosUserId": "user_123"}'

# View logs
npx convex logs
```

## Test Structure (When Implemented)

**Recommended Structure:**

```typescript
// convex/__tests__/customers.test.ts (hypothetical)
import { test, expect } from "@convex-test/core"
import { api } from "../_generated/api"

test("listCustomers returns all customers for admin", async (ctx) => {
  // Setup: Create test org and customers
  const orgId = await ctx.runMutation(api.testHelpers.createTestOrg, {
    name: "Test Org"
  })

  const customerId1 = await ctx.runMutation(api.customers.crud.createCustomer, {
    name: "Customer 1"
  })

  const customerId2 = await ctx.runMutation(api.customers.crud.createCustomer, {
    name: "Customer 2"
  })

  // Execute: Call query
  const customers = await ctx.runQuery(api.customers.crud.listCustomers)

  // Assert: Verify results
  expect(customers).toHaveLength(2)
  expect(customers[0]?.name).toBe("Customer 1")
  expect(customers[1]?.name).toBe("Customer 2")
})

test("createCustomer throws error when at limit", async (ctx) => {
  // Setup: Create org at customer limit
  const orgId = await ctx.runMutation(api.testHelpers.createTestOrg, {
    name: "Test Org",
    maxCustomers: 1
  })

  await ctx.runMutation(api.customers.crud.createCustomer, {
    name: "Customer 1"
  })

  // Execute & Assert: Expect error
  await expect(
    ctx.runMutation(api.customers.crud.createCustomer, {
      name: "Customer 2"
    })
  ).rejects.toThrow("Customer limit reached")
})
```

**File Naming:**
- `*.test.ts` suffix (example: `customers.test.ts`, `auth.test.ts`)
- Co-located or in `convex/__tests__/` directory (team preference)

## Mocking

**Framework:**
- Not currently used
- When implementing: Consider `vitest` for consistent TypeScript experience

**Patterns (When Implemented):**

```typescript
// Mock Convex context
const mockCtx = {
  db: {
    query: jest.fn(),
    get: jest.fn(),
    insert: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  auth: {
    getUserIdentity: jest.fn(),
  }
}

// Mock external services
jest.mock('@workos-inc/node', () => ({
  WorkOS: jest.fn()
}))

// Mock test helpers
const mockCreateOrg = jest.fn().mockResolvedValue("org_123")
```

**What to Mock:**
- Convex `ctx` context for isolated function testing
- WorkOS API calls (authentication, org management)
- External webhooks (Lemon Squeezy billing)
- Time-based functions (`Date.now()`)

**What NOT to Mock:**
- Convex schema validators (test real validation)
- Database index behavior (test query patterns)
- Authentication flow end-to-end
- User permission checks (test actual access control)

## Test Data & Fixtures

**Test Helpers (Proposed):**

```typescript
// convex/testHelpers.ts
import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const createTestOrg = internalMutation({
  args: {
    name: v.string(),
    maxCustomers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Test helpers disabled in production")
    }

    return await ctx.db.insert("orgs", {
      workosOrgId: `test-${Date.now()}`,
      name: args.name,
      maxCustomers: args.maxCustomers ?? 10,
      maxStaff: 5,
      maxClients: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
})

export const createTestUser = internalMutation({
  args: {
    orgId: v.id("orgs"),
    role: v.union(v.literal("admin"), v.literal("staff"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      workosUserId: `user-${Date.now()}`,
      orgId: args.orgId,
      role: args.role,
      email: `test-${Date.now()}@example.com`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
})
```

**Fixture Location:**
- `convex/testHelpers.ts` for Convex function factories
- `src/__tests__/fixtures.ts` for React component test data

## Coverage

**Requirements:**
- Not enforced currently
- When implementing: Target minimum 70% for critical paths (auth, billing, CRUD)

**View Coverage (When Implemented):**
```bash
npm test -- --coverage
```

Expected coverage report shows:
- Line coverage
- Branch coverage (conditional logic)
- Function coverage
- Statement coverage

## Test Types

**Unit Tests:**
- Scope: Single function or component in isolation
- Approach: Mock dependencies, test with various inputs
- Examples: `cn()` utility, `useIsMobile()` hook, schema validators
- Location: `convex/__tests__/utils.test.ts`, `src/__tests__/lib.test.ts`

**Integration Tests:**
- Scope: Multiple functions working together
- Approach: Real Convex context, test query→mutation chains
- Examples: Create org, create user, add customer (verify all linked correctly)
- Location: `convex/__tests__/integration.test.ts`

**E2E Tests:**
- Framework: Playwright (recommended, not currently implemented)
- Scope: Full user workflows through browser
- Approach: Real backend, real UI interactions
- Examples: Sign in → Create customer → Update customer → Delete customer
- Installation when ready:
  ```bash
  npm init playwright@latest
  ```

**E2E Test Example (Playwright):**

```typescript
// e2e/customers.spec.ts (when implemented)
import { test, expect } from '@playwright/test'

test('admin can create and delete customer', async ({ page }) => {
  // Setup: Sign in as admin (requires test user fixture)
  await page.goto('/login')
  await page.fill('[type="email"]', 'admin@test.com')
  // ... complete WorkOS flow (manual in test environment)

  // Navigate to customers
  await page.goto('/customers')
  await expect(page.locator('text=Add Customer')).toBeVisible()

  // Create customer
  await page.click('text=Add Customer')
  await page.fill('[id="name"]', 'Test Company')
  await page.fill('[id="email"]', 'contact@test.com')
  await page.click('text=Create Customer')

  // Verify creation
  await expect(page.locator('text=Test Company')).toBeVisible()

  // Delete customer
  await page.click('[aria-label="Delete"]')
  await page.click('text=Delete')

  // Verify deletion
  await expect(page.locator('text=Test Company')).not.toBeVisible()
})
```

## Common Patterns (When Testing)

**Async Testing:**

```typescript
test("async mutation completes", async (ctx) => {
  const customerId = await ctx.runMutation(api.customers.crud.createCustomer, {
    name: "Test",
  })

  expect(customerId).toBeDefined()
})
```

**Error Testing:**

```typescript
test("query throws ConvexError when not authenticated", async (ctx) => {
  // Don't set auth identity
  await expect(
    ctx.runQuery(api.customers.crud.listCustomers)
  ).rejects.toThrow("Not authenticated")
})

test("mutation throws with specific message", async (ctx) => {
  const error = await expect(
    ctx.runMutation(api.customers.crud.createCustomer, { name: "" })
  ).rejects.toThrow()

  expect(error.message).toContain("limit reached")
})
```

**Role-Based Access Testing:**

```typescript
test("staff cannot delete customer", async (ctx) => {
  const staffUserId = await createTestUser(ctx, "staff")
  const customerId = await createTestCustomer(ctx)

  await expect(
    ctx.runMutation(api.customers.crud.deleteCustomer, { customerId }, {
      userId: staffUserId
    })
  ).rejects.toThrow("Only admins can delete")
})
```

## Testing Checklists

### Authentication Testing

| Test | Steps | Expected |
|------|-------|----------|
| Sign in flow | Visit home, click sign in, complete WorkOS form | Redirected to dashboard, session created |
| Sign out | Click sign out button | Redirected to home, session cleared |
| Protected route | Visit `/dashboard` while logged out | Redirect to sign in |
| Token refresh | Keep session 15+ min, perform action | Seamless refresh, no error |
| Role-based access | Staff tries `/admin` page (if it exists) | 403 or redirect to dashboard |

### Multi-Tenancy Testing

| Test | Steps | Expected |
|------|-------|----------|
| Data isolation | Create customer in Org A, switch to Org B | Org B cannot see Org A's customers |
| Staff assignment | Assign staff to Customer 1, not Customer 2 | Staff only sees Customer 1 |
| Client isolation | Client user logs in | Sees only their own customer data |
| Cross-org query | Manually test with different `orgId` | Returns 403 Access Denied |

### CRUD Testing

| Test | Steps | Expected |
|------|-------|----------|
| Create | Open customers, click "Add Customer", fill form | Customer created, appears in list |
| Read | Click customer in list | Customer details displayed |
| Update | Edit customer details, save | Changes persisted, UI updates |
| Delete | Click delete, confirm | Customer removed from list |
| Validation | Submit form with empty name | Shows validation error |

### Billing/Usage Testing

| Test | Steps | Expected |
|------|-------|----------|
| Usage limit | Create customers until at limit | "At Limit" badge shows, add button disabled |
| Upgrade prompt | Click "Upgrade plan" at limit | Redirects to billing page |
| Plan display | Check dashboard stat card | Correct plan name shown |
| Subscription status | Check org record | Status matches Lemon Squeezy |

## Performance Testing

**Convex Performance:**

```bash
# Monitor via dashboard
npx convex dashboard

# Look for:
# - Slow queries (>100ms)
# - High read/write counts
# - Missing indexes
```

**Frontend Performance:**

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000
```

Key metrics:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

## Debugging Failed Tests

**Convex Function Fails:**

1. Check logs:
   ```bash
   npx convex logs
   ```

2. Test in dashboard with same arguments

3. Add debugging:
   ```typescript
   console.log("Input:", args)
   console.log("User identity:", ctx.auth?.getUserIdentity())
   console.log("Found user:", userRecord)
   ```

**Frontend Test Fails (When Using Playwright):**

1. Run with visible browser:
   ```bash
   npx playwright test --headed
   ```

2. Slow down for visibility:
   ```typescript
   test.use({ launchOptions: { slowMo: 500 } })
   ```

3. Take screenshots:
   ```typescript
   await page.screenshot({ path: 'debug.png' })
   ```

## CI/CD Testing

**GitHub Actions Example (When Ready):**

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - run: npm ci

      - run: npm run lint

      - run: npm run build

      # Add when tests are ready:
      # - run: npm test
      # - run: npm run test:e2e
```

## Resources

- [Convex Testing Documentation](https://docs.convex.dev/testing)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

---

*Testing analysis: 2026-02-09*
