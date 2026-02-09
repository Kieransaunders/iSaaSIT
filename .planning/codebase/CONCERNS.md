# Codebase Concerns

**Analysis Date:** 2026-02-09

## Tech Debt

**Hardcoded `as any` Type Assertions:**
- Issue: Multiple files use `as any` to bypass TypeScript type checking instead of properly typing values
- Files: `src/router.tsx` (line 11), `src/routes/_authenticated/customers.tsx` (lines 23, 51), `src/routes/_authenticated/customers/.tsx` (lines 23, 51), `convex/orgs/update.ts` (line 265), `convex/workos/updateOrg.ts`
- Impact: Reduces type safety and IDE help; makes refactoring risky; hides potential bugs
- Fix approach: Properly type environment variables with Vite's typed env support, properly type Convex mutation arguments instead of casting to `any`

**Placeholder `numbers` Table in Schema:**
- Issue: The `numbers` table in `convex/schema.ts` (lines 89-91) is noted as temporary ("Keep numbers table from template until fully migrated")
- Files: `convex/schema.ts`, likely used in `convex/myFunctions.ts`
- Impact: Dead code increases maintenance burden; suggests incomplete migration from template
- Fix approach: Remove the table and any template code once fully migrated to production schema

**Duplicate Auth Checks:**
- Issue: Every function in `convex/customers/crud.ts` repeats the same auth check pattern (lines 12-23, 74-85, 137-148, etc.)
- Files: `convex/customers/crud.ts`, `convex/orgs/create.ts`
- Impact: Code duplication makes auth logic harder to maintain; changes to auth validation must be made in multiple places
- Fix approach: Extract auth pattern to shared helper function like `requireAuth(ctx)` or `getCurrentUser(ctx)` (pattern already suggested in SECURITY.md but not implemented)

**Duplicate Org Limit Defaults:**
- Issue: Free tier limits (3 customers, 2 staff, 10 clients) are hardcoded in multiple places
- Files: `convex/orgs/create.ts` (lines 39-41 and 95-97), `convex/orgs/get.ts` likely has similar
- Impact: If plan structure changes, must update in multiple places; risk of inconsistency
- Fix approach: Define plan constants in a shared config file

## Known Bugs

**Hardcoded Usage Stats in Billing Page:**
- Symptoms: The billing page shows static placeholder values (0 customers, 1 team member, 0 external users) regardless of actual org data
- Files: `src/routes/_authenticated/billing.tsx` (lines 40-54)
- Trigger: Navigate to `/billing` tab in authenticated app
- Workaround: Manually fetch org data using `useQuery(api.orgs.get.getOrg)` instead of hardcoded values
- Impact: Users cannot see actual plan usage; misleads on upgrade decisions

**Missing Duplicate Org ID Check in Onboarding:**
- Symptoms: If onboarding form submitted twice quickly, could create duplicate orgs
- Files: `convex/workos/createOrg.ts` (lines 32-38), `convex/orgs/create.ts` (lines 22-29 has check, but action doesn't)
- Trigger: Rapid form submissions on onboarding page
- Workaround: None; second submission will error
- Impact: Stale org records; orphaned WorkOS organizations

**`as any` Cast in Customer Detail Page:**
- Symptoms: Type system cannot validate customerId matches route parameter shape
- Files: `src/routes/_authenticated/customers/.tsx` (line 23)
- Trigger: Any route ID type change would not be caught by TypeScript
- Impact: Silent failures if route param types change

## Security Considerations

**Environment Variable Exposure in Router:**
- Risk: `import.meta.env.VITE_CONVEX_URL` accessed with `as any` cast, bypassing type safety
- Files: `src/router.tsx` (line 11)
- Current mitigation: Vite only exposes vars prefixed with `VITE_` to client
- Recommendations: Use Vite's `type ImportMetaEnv` interface or create typed env config module to eliminate `as any`

**No Input Sanitization Before Storage:**
- Risk: Customer names and notes are stored directly without sanitization
- Files: `convex/customers/crud.ts` (lines 183-189, 269-271), `src/routes/_authenticated/customers.tsx` (line 65-68)
- Current mitigation: None; relies on Convex value validation only (basic string type check)
- Recommendations: Add sanitization function for user input (pattern shown in SECURITY.md but not used in codebase)

**Weak Email Validation:**
- Risk: Email validation in onboarding only checks for `@` symbol
- Files: `src/routes/onboarding.tsx` (line 46)
- Current mitigation: Minimal check; WorkOS may validate further
- Recommendations: Use proper email regex or validation library

**Staff-Customer Assignment Orphans on Delete:**
- Risk: When staff user is deleted, their customer assignments are not cleaned up (reverse cascade missing)
- Files: `convex/customers/crud.ts` has cleanup on customer delete (lines 325-332), but no equivalent in users delete
- Current mitigation: None; assignments become stale
- Recommendations: Add cleanup in user deletion function

**No Validation of Role Enum Values:**
- Risk: If WorkOS returns unexpected role value, it's stored as-is in users table
- Files: `convex/orgs/create.ts` (lines 114, 124), `convex/workos/storeOrg.ts` likely stores role
- Current mitigation: Schema defines role union, but upstream from WorkOS is not validated
- Recommendations: Validate WorkOS role against allowed set before storing

## Performance Bottlenecks

**Customer List Query for Staff Users:**
- Problem: Staff fetching visible customers requires sequential Promise.all on customer IDs
- Files: `convex/customers/crud.ts` (lines 48-50)
- Cause: Must fetch individual customer docs after getting assignments
- Improvement path: Add indexed query on customers by `(orgId, _id)` to batch-fetch, or add denormalized `customerIds` array to staff assignments

**No Pagination on Customer List:**
- Problem: All customers loaded into memory even if org has hundreds
- Files: `convex/customers/crud.ts` (line 38), `src/routes/_authenticated/customers.tsx` (line 51)
- Cause: `collect()` fetches all results; no cursor or limit
- Improvement path: Implement cursor-based pagination with `Query.paginate()` in Convex; limit to 50 per page client-side

**Synchronous Query for Org Limits on Every Customer Create:**
- Problem: Must fetch org for maxCustomers check, then fetch all existing customers to count
- Files: `convex/customers/crud.ts` (lines 163-172)
- Cause: No pre-computed count in org record; must enumerate all
- Improvement path: Add `customerCount` field to orgs table, updated via indexed trigger query

## Fragile Areas

**Onboarding Flow - No Idempotency:**
- Files: `convex/workos/createOrg.ts`, `convex/orgs/create.ts`, `src/routes/onboarding.tsx`
- Why fragile: Multi-step org creation (WorkOS → Convex → User → redirect) has no rollback; network failure mid-flow leaves orphaned data. Re-submission creates duplicates. No dedup key.
- Safe modification: Wrap createOrganization action in transaction-like pattern; use WorkOS org ID as dedup key; add idempotency check before each step
- Test coverage: No tests; critical path untested

**Auth Initialization in Router:**
- Files: `src/router.tsx` (lines 50-73)
- Why fragile: `useAuthFromWorkOS` hook uses optional chaining on `useAuth()` result; if AuthKitProvider not mounted first, fails silently. If accessToken updates don't propagate, auth state stale.
- Safe modification: Add null checks and error boundaries; test with AuthKit provider missing; validate token refresh timing
- Test coverage: No tests for auth flow edge cases

**Role-Based Access Control Across 5 Files:**
- Files: `convex/customers/crud.ts`, `convex/orgs/update.ts`, `convex/workos/storeOrg.ts`, etc.
- Why fragile: RBAC logic inlined in every handler; if role values change (e.g., "admin" → "administrator"), must update in multiple places. Hard to audit all access checks.
- Safe modification: Extract RBAC to centralized policy engine; add integration tests that verify each role can only access allowed resources
- Test coverage: No tests for RBAC; cannot verify "staff cannot delete customers" is enforced everywhere

**Customer Deletion Cascades:**
- Files: `convex/customers/crud.ts` (lines 321-335)
- Why fragile: Manually cascades to staffCustomerAssignments. If new tables added that reference customers, must remember to add cleanup.
- Safe modification: Use Convex automatic deletion cascades when possible; document all foreign keys explicitly; add migration for existing orphans
- Test coverage: No tests for cascade behavior

## Scaling Limits

**Organization Limits Hardcoded:**
- Current capacity: Free tier (3 customers, 2 staff, 10 clients); not enforced beyond plan
- Limit: If Convex billing integration added, no way to scale limits dynamically; must redeploy to change
- Scaling path: Store limits in a `plans` table, reference by `planId` in org; allow runtime updates without redeployment

**No Pagination Architecture:**
- Current capacity: UI loads all customers at once; functional up to ~100-200 records
- Limit: With 1000+ customers, browser memory and query time explode; Convex function timeout (300s) may hit
- Scaling path: Implement cursor-based pagination throughout; add server-side filtering/search; denormalize frequently-accessed data

**Single Convex Deployment:**
- Current capacity: Convex free tier (1M function calls/month, 5GB storage)
- Limit: At scale (1000+ orgs, 10k+ customers), will quickly exceed quotas
- Scaling path: Plan Convex paid tier; implement request batching; cache frequently accessed data; consider eventual consistency patterns

## Dependencies at Risk

**WorkOS AuthKit Version Lock:**
- Risk: `@workos/authkit-tanstack-react-start` version pinned to exact `0.5.0` (package.json line 44)
- Impact: Cannot receive security patches for minor versions; if WorkOS releases 0.5.1 bug fix, not applied
- Migration plan: Switch to `^0.5.0` or `~0.5.0` semver; test on each minor update before release

**Convex React Query Integration Immature:**
- Risk: `@convex-dev/react-query` is `^0.1.0` (early stage); API may change without major version bump
- Impact: Breaking changes possible in minor updates; integration may diverge from Convex or React Query conventions
- Migration plan: Monitor GitHub releases; stay on supported versions; consider direct Convex hooks if integration breaks

**Radix UI v1 / Shadcn UI Lag:**
- Risk: `radix-ui` pinned to `1.4.3` (package.json line 50); Radix v2 already released
- Impact: Missing accessibility fixes, performance improvements; newer integrations may not support v1
- Migration plan: Plan gradual migration to Radix v2; use separate branch; test all components

## Missing Critical Features

**Billing Integration Incomplete:**
- Problem: Billing page is UI shell; no Lemon Squeezy integration, no plan enforcement, no usage tracking
- Blocks: Cannot charge customers; cannot enforce plan limits in production; cannot support tiered features
- Impact: MVP cannot monetize; workarounds with static plan caps confuse users

**No Error Logging / Monitoring:**
- Problem: Errors throw silently or to console; no centralized error tracking
- Blocks: Cannot diagnose production issues; cannot alert on errors; cannot measure reliability
- Impact: Silent failures in production; no observability of customer impact

**No Audit Trail:**
- Problem: No logging of who deleted/modified what customer or org data
- Blocks: Cannot debug data corruption; cannot provide compliance reports; cannot investigate security incidents
- Impact: Regulatory/GDPR compliance gap; cannot audit org admin actions

## Test Coverage Gaps

**Authentication Flow:**
- What's not tested: Onboarding success/failure paths, token refresh, WorkOS integration points
- Files: `src/routes/onboarding.tsx`, `convex/workos/createOrg.ts`, `src/router.tsx`
- Risk: Silent auth failures; user onboarding breaks without alerting
- Priority: High - blocks user acquisition

**Authorization (RBAC):**
- What's not tested: Staff cannot modify customers, clients cannot delete, admin enforcement
- Files: `convex/customers/crud.ts`, entire RBAC surface
- Risk: Privilege escalation vulnerability; users access data they shouldn't
- Priority: High - security critical

**Data Isolation (Multi-Tenancy):**
- What's not tested: Org A cannot see Org B data, cross-org access attempts
- Files: `convex/customers/crud.ts`, all queries
- Risk: Data leak between organizations
- Priority: High - security critical

**Plan Limit Enforcement:**
- What's not tested: Creating 4th customer when limit is 3, staff exceeding team limit
- Files: `convex/customers/crud.ts` (lines 175-179)
- Risk: Limit enforcement bypassed in edge cases; unlimited usage if bypass found
- Priority: Medium - revenue impact

**Error Scenarios:**
- What's not tested: Network failures, Convex unavailable, WorkOS API down, malformed inputs
- Files: Entire codebase
- Risk: Cascading failures; unclear error messages; poor UX during incidents
- Priority: Medium - operational stability

---

*Concerns audit: 2026-02-09*
