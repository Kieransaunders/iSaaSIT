# Architecture: Platform Admin Console Integration

**Project:** iSaaSIT SaaS Starter Kit
**Domain:** Platform-level admin console for multi-tenant SaaS
**Researched:** 2026-02-06
**Confidence:** HIGH

## Executive Summary

The admin console integrates as a **separate route tree** with its own authentication layer, layout system, and data access patterns. This architecture maintains clear separation between org-level operations (scoped by orgId) and platform-level operations (cross-org access).

**Key architectural decisions:**
- Use TanStack Start's pathless layout routes (_admin) for route isolation
- Store platform admin flag in WorkOS user metadata, expose via JWT template
- Create custom Convex query/mutation builders (adminQuery, adminMutation) for cross-org access
- Implement impersonation as JWT-based context switching with audit logging
- Build separate AdminSidebar component parallel to existing AppSidebar

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TanStack Start App                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐              ┌────────────────┐         │
│  │  Public Routes │              │  Auth Routes   │         │
│  │  /             │              │  /callback     │         │
│  │                │              │  /onboarding   │         │
│  └────────────────┘              └────────────────┘         │
│                                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │         _authenticated (Org-Level)            │           │
│  │  Layout: MainLayout + AppSidebar              │           │
│  │  Auth: WorkOS user with orgId                 │           │
│  │  Data: orgQuery (scoped by orgId)             │           │
│  │                                                │           │
│  │  /dashboard, /customers, /team,               │           │
│  │  /billing, /settings                          │           │
│  └──────────────────────────────────────────────┘           │
│                                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │         _admin (Platform-Level)               │           │
│  │  Layout: AdminLayout + AdminSidebar           │           │
│  │  Auth: WorkOS user with is_platform_admin     │           │
│  │  Data: adminQuery (cross-org access)          │           │
│  │                                                │           │
│  │  /admin/overview, /admin/organizations,       │           │
│  │  /admin/users, /admin/impersonate             │           │
│  └──────────────────────────────────────────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### Existing Components (Modified)

| Component | Current Responsibility | New Responsibility | Integration Point |
|-----------|------------------------|-------------------|-------------------|
| `src/routes/_authenticated.tsx` | Wraps org-level routes | Add admin check, redirect admins to /admin | Loader: check JWT for is_platform_admin |
| `src/components/layout/app-sidebar.tsx` | Org-level navigation | Add conditional admin entry link (if admin) | Footer: "Admin Console" link visible if JWT contains admin flag |
| Convex auth.config.ts | Configure WorkOS JWT validation | No change | Already validates WorkOS JWTs |

### New Components (To Build)

| Component | Responsibility | Dependencies |
|-----------|---------------|--------------|
| `src/routes/_admin.tsx` | Admin layout route wrapper | WorkOS auth, admin check in loader |
| `src/routes/_admin/index.tsx` | Admin dashboard/overview | adminQuery builders |
| `src/routes/_admin/organizations.tsx` | List all orgs, view details | adminQuery for cross-org data |
| `src/routes/_admin/users.tsx` | List all platform users | adminQuery for users table |
| `src/routes/_admin/impersonate.tsx` | User impersonation UI | Impersonation service |
| `src/components/layout/admin-layout.tsx` | Admin page layout wrapper | AdminSidebar, breadcrumbs |
| `src/components/layout/admin-sidebar.tsx` | Admin navigation | None (parallel to AppSidebar) |
| `src/components/admin/impersonation-banner.tsx` | Shows when impersonating | Convex impersonation context |
| `convex/lib/customFunctions.ts` | Custom query/mutation builders | convex-helpers |
| `convex/admin/orgs.ts` | Admin queries for all orgs | adminQuery builder |
| `convex/admin/users.ts` | Admin queries for all users | adminQuery builder |
| `convex/admin/impersonation.ts` | Impersonation token generation | internalMutation, JWT signing |

## Integration Points with Existing Architecture

### 1. Route Structure: TanStack Start File-Based Routing

**Pattern:** Pathless Layout Routes with underscore prefix

**Implementation:**
```
src/routes/
├── __root.tsx                    # [existing] Root layout
├── index.tsx                      # [existing] Landing page
├── callback.tsx                   # [existing] Auth callback
├── onboarding.tsx                 # [existing] Onboarding
├── _authenticated.tsx             # [MODIFIED] Add admin redirect
├── _authenticated/
│   ├── dashboard.tsx              # [existing] Org dashboard
│   ├── customers.tsx              # [existing] Customers
│   └── ...                        # [existing] Other org routes
└── _admin.tsx                     # [NEW] Admin layout route
    └── _admin/
        ├── index.tsx               # [NEW] Admin overview
        ├── organizations.tsx       # [NEW] All orgs
        ├── users.tsx               # [NEW] All users
        └── impersonate.tsx         # [NEW] Impersonation
```

**Why this works:**
- `_admin.tsx` creates a pathless layout route (URL: `/admin/*`)
- Does NOT inherit from `_authenticated.tsx` layout
- Can define separate loader with admin-specific auth checks
- Child routes automatically nest under `/admin` prefix

**Sources:**
- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/api/file-based-routing)
- [Pathless Layout Routes](https://tanstack.com/router/v1/docs/framework/react/routing/routing-concepts)
- [Custom Layout for Route Groups](https://dev.to/xb16/custom-layout-for-specific-route-group-in-tanstack-router-solution-2ndp)

### 2. Auth Layer: WorkOS + Platform Admin Flag

**Current pattern:**
- WorkOS JWT contains `subject` (user ID), `org_id` (organization ID), `role` (org role)
- Convex queries use `ctx.auth.getUserIdentity()` to get JWT claims
- Queries filter by orgId from user's org membership

**Admin pattern:**
- Store `is_platform_admin: true` in WorkOS user metadata
- Create JWT template in WorkOS to expose metadata as claim
- Add loader check in `_admin.tsx` to verify admin flag

**Implementation:**

```typescript
// src/routes/_admin.tsx
export const Route = createFileRoute('/_admin')({
  loader: async ({ context }) => {
    const { user } = await getAuth();
    if (!user) {
      const href = await getSignInUrl();
      throw redirect({ href });
    }

    // Check for platform admin flag in JWT custom claims
    // (Exposed via WorkOS JWT template)
    if (!user.is_platform_admin) {
      throw redirect({ href: '/dashboard' }); // Redirect to org app
    }

    return { user };
  },
  component: AdminLayout,
});
```

**WorkOS setup:**
1. Update user metadata via API: `PATCH /user_management/users/:id` with `{ metadata: { is_platform_admin: "true" } }`
2. Create JWT template in WorkOS dashboard to include `"is_platform_admin": {{ user.metadata.is_platform_admin }}`
3. JWT now contains `is_platform_admin: true` for admin users

**Security considerations:**
- Metadata can only be updated via WorkOS API (requires API key)
- JWT signing prevents tampering
- Convex re-validates JWT on every request

**Sources:**
- [WorkOS User Metadata](https://workos.com/docs/authkit/metadata)
- [WorkOS Roles and Permissions](https://workos.com/docs/user-management/roles-and-permissions)

### 3. Data Access: Convex Custom Query Builders

**Current pattern:**
```typescript
// convex/customers/crud.ts
export const listCustomers = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    const userRecord = await ctx.db.query("users")
      .withIndex("by_workos_user_id", q => q.eq("workosUserId", user.subject))
      .first();

    // Scoped by orgId
    return ctx.db.query("customers")
      .withIndex("by_org", q => q.eq("orgId", userRecord.orgId))
      .collect();
  }
});
```

**Admin pattern:**
```typescript
// convex/lib/customFunctions.ts
import { customQuery, customMutation } from "convex-helpers/server/customFunctions";
import { query, mutation } from "./_generated/server";

// Admin query builder - enforces platform admin check
export const adminQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Check platform admin flag (from JWT custom claim)
    if (!user.is_platform_admin) {
      throw new ConvexError("Platform admin access required");
    }

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", q => q.eq("workosUserId", user.subject))
      .first();

    return {
      ctx: { user, userRecord, isPlatformAdmin: true },
      args: {},
    };
  },
});

export const adminMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    if (!user.is_platform_admin) {
      throw new ConvexError("Platform admin access required");
    }

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", q => q.eq("workosUserId", user.subject))
      .first();

    return {
      ctx: { user, userRecord, isPlatformAdmin: true },
      args: {},
    };
  },
});
```

**Usage:**
```typescript
// convex/admin/orgs.ts
import { adminQuery } from "../lib/customFunctions";

export const listAllOrgs = adminQuery({
  handler: async (ctx) => {
    // No orgId scoping - returns ALL orgs
    return ctx.db.query("orgs").collect();
  },
});

export const getOrgDetails = adminQuery({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);

    // Get all users in this org
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", q => q.eq("orgId", args.orgId))
      .collect();

    // Get all customers in this org
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_org", q => q.eq("orgId", args.orgId))
      .collect();

    return { org, users, customers };
  },
});
```

**Why this pattern:**
- **Explicit intent:** `adminQuery` vs `query` makes privilege boundary visible
- **Type safety:** Custom context includes `isPlatformAdmin` flag
- **Reusability:** All admin endpoints use same builder
- **Security:** Auth check enforced at builder level, can't be bypassed

**Sources:**
- [Convex Custom Functions](https://stack.convex.dev/custom-functions)
- [convex-helpers customQuery](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md)
- [Authorization Best Practices](https://stack.convex.dev/authorization)

### 4. Impersonation Architecture

**Requirements:**
- Platform admin can "act as" any user/org
- Maintains audit trail (who impersonated whom, when)
- Visual indicator in UI
- Restricted actions (can't change passwords, delete orgs)
- Session-based (can end impersonation)

**Architecture Flow:**

```
┌─────────────────────────────────────────────────────────┐
│                    Impersonation Flow                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Admin clicks "Impersonate" on user                   │
│     ↓                                                     │
│  2. Call Convex action: startImpersonation(targetUserId) │
│     ↓                                                     │
│  3. Action validates:                                     │
│     - Caller is platform admin                           │
│     - Target user exists                                 │
│     - No active impersonation session                    │
│     ↓                                                     │
│  4. Generate impersonation JWT:                          │
│     {                                                     │
│       sub: targetUserId,         // Who we're acting as  │
│       adminId: adminUserId,      // Who initiated        │
│       sessionId: uuid(),         // Track this session   │
│       isImpersonation: true,     // Flag for UI          │
│       exp: now + 1h              // Short lifetime       │
│     }                                                     │
│     ↓                                                     │
│  5. Store session in DB:                                 │
│     {                                                     │
│       sessionId, adminUserId, targetUserId,              │
│       startedAt, expiresAt, active: true                 │
│     }                                                     │
│     ↓                                                     │
│  6. Client stores impersonation JWT in sessionStorage    │
│     ↓                                                     │
│  7. All requests use impersonation JWT                   │
│     - Convex sees targetUserId as authenticated user     │
│     - UI shows impersonation banner                      │
│     ↓                                                     │
│  8. Admin clicks "End Impersonation"                     │
│     ↓                                                     │
│  9. Clear sessionStorage, reload page                    │
│     ↓                                                     │
│  10. Back to admin's original session                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Schema addition:**
```typescript
// convex/schema.ts
impersonationSessions: defineTable({
  sessionId: v.string(),
  adminUserId: v.id("users"),
  targetUserId: v.id("users"),
  targetOrgId: v.optional(v.id("orgs")),
  startedAt: v.number(),
  expiresAt: v.number(),
  endedAt: v.optional(v.number()),
  active: v.boolean(),
  // Audit trail
  adminIpAddress: v.optional(v.string()),
  reason: v.optional(v.string()),
})
  .index("by_session_id", ["sessionId"])
  .index("by_admin", ["adminUserId"])
  .index("by_target", ["targetUserId"])
  .index("by_active", ["active"]),
```

**Security considerations:**
- Short JWT lifetime (1 hour)
- Restricted actions enforced in mutations (check `isImpersonation` flag, reject sensitive operations)
- Comprehensive audit logging
- One session per admin
- Session revocation on sign out

**Sources:**
- [User Impersonation Implementation](https://oneuptime.com/blog/post/2026-01-30-impersonation-implementation/view)
- [SaaS Security Best Practices](https://gainhq.com/blog/saas-security-best-practices/)

## Data Flow Patterns

### Org-Level Data Flow (Existing)

```
User Request → TanStack Router → _authenticated layout
                ↓
          Check WorkOS auth (JWT with orgId)
                ↓
          Convex query (filtered by orgId)
                ↓
          Return org-scoped data
```

### Admin-Level Data Flow (New)

```
Admin Request → TanStack Router → _admin layout
                ↓
          Check WorkOS auth + is_platform_admin flag
                ↓
          Convex adminQuery (NO orgId filter)
                ↓
          Return cross-org data
```

### Impersonation Data Flow (New)

```
Admin clicks "Impersonate" → Convex action
                ↓
          Validate admin permission
                ↓
          Generate impersonation JWT
                ↓
          Store session in DB
                ↓
          Return JWT to client
                ↓
          Client stores in sessionStorage
                ↓
          All subsequent requests use impersonation JWT
                ↓
          Convex sees targetUserId, marks as impersonation
                ↓
          UI shows banner, blocks sensitive actions
```

## Build Order & Dependencies

### Phase 1: Foundation (No dependencies)

**Goal:** Set up platform admin identification and route structure

1. **Update WorkOS user metadata**
   - Use WorkOS API to set `is_platform_admin: true` for your admin user
   - Create JWT template to expose metadata as custom claim

2. **Create admin route structure**
   - Add `src/routes/_admin.tsx` with auth check
   - Add `src/routes/_admin/index.tsx` (simple dashboard)
   - Test: Admin can access `/admin`, non-admins redirected

3. **Add admin entry link**
   - Modify `src/components/layout/app-sidebar.tsx` to show "Admin Console" link for admins
   - Test: Link only visible to admins

**Deliverable:** Admin users can navigate to `/admin` route, see basic page

### Phase 2: Data Access (Depends on Phase 1)

**Goal:** Enable cross-org queries

4. **Install convex-helpers**
   ```bash
   npm install convex-helpers
   ```

5. **Create custom query builders**
   - Add `convex/lib/customFunctions.ts` with `adminQuery` and `adminMutation`
   - Add auth check for `is_platform_admin` in builder

6. **Create admin Convex functions**
   - Add `convex/admin/orgs.ts` with `listAllOrgs` and `getOrgDetails`
   - Add `convex/admin/users.ts` with `listAllUsers`
   - Test: Queries return cross-org data for admins, reject for non-admins

**Deliverable:** Admin queries work in Convex dashboard

### Phase 3: Admin UI (Depends on Phase 2)

**Goal:** Build admin console pages

7. **Create admin layout components**
   - Add `src/components/layout/admin-layout.tsx`
   - Add `src/components/layout/admin-sidebar.tsx`
   - Integrate with `_admin.tsx` route

8. **Build organization management pages**
   - Add `src/routes/_admin/organizations.tsx` (list all orgs)
   - Add `src/routes/_admin/organizations/$orgId.tsx` (org details)
   - Show: Org name, subscription status, user count, customer count

9. **Build user management pages**
   - Add `src/routes/_admin/users.tsx` (list all platform users)
   - Show: User email, org affiliation, role, created date

**Deliverable:** Admin can view all orgs and users in UI

### Phase 4: Impersonation (Depends on Phase 3)

**Goal:** Enable user impersonation with audit trail

10. **Update schema**
    - Add `impersonationSessions` table to `convex/schema.ts`

11. **Create impersonation backend**
    - Add `convex/admin/impersonation.ts` with:
      - `startImpersonation` action (generates JWT)
      - `endImpersonation` action (marks session ended)
      - Internal mutations for session management
    - Install JWT signing library (`jose`)
    - Implement JWT generation with custom claims

12. **Build impersonation UI**
    - Add `src/routes/_admin/impersonate.tsx` (user search + impersonate button)
    - Add `src/components/admin/impersonation-banner.tsx` (shows when active)
    - Add impersonation store (Zustand) for client state
    - Add "End Impersonation" flow

13. **Add restricted actions**
    - Update sensitive mutations to check `isImpersonation` flag
    - Block: Password changes, user deletion, org deletion
    - Allow: Read operations, customer CRUD, data viewing

**Deliverable:** Admin can impersonate users, see their view, end session

### Phase 5: Polish (Depends on Phase 4)

**Goal:** Production-ready admin console

14. **Audit logging**
    - Create dedicated audit log table
    - Log all admin actions (org views, user views, impersonation)
    - Add audit log viewer in admin console

15. **Error handling**
    - Add error boundaries for admin routes
    - Handle expired impersonation sessions gracefully
    - Add loading states for admin queries

16. **Testing**
    - Test admin access control (non-admins can't access)
    - Test impersonation flows (start, use, end)
    - Test restricted actions (blocked operations during impersonation)

**Deliverable:** Production-ready admin console with audit trail

## Dependency Graph

```
Phase 1: Foundation
  ├─ WorkOS metadata setup
  ├─ Admin route structure
  └─ Admin entry link
        ↓
Phase 2: Data Access
  ├─ convex-helpers installation
  ├─ Custom query builders
  └─ Admin Convex functions
        ↓
Phase 3: Admin UI
  ├─ Admin layout components
  ├─ Organization pages
  └─ User pages
        ↓
Phase 4: Impersonation
  ├─ Schema update
  ├─ Impersonation backend
  ├─ Impersonation UI
  └─ Restricted actions
        ↓
Phase 5: Polish
  ├─ Audit logging
  ├─ Error handling
  └─ Testing
```

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 4
**Parallel work:** Phase 5 can start after Phase 3 (audit logging, error handling)

## Patterns to Follow

### Pattern 1: Explicit Intent Separation

**What:** Create separate query/mutation builders for different privilege levels

**When:** Any time data access patterns differ by role

**Example:**
```typescript
// DON'T: Parameterize single function
export const getOrgs = query({
  args: { includeAllOrgs: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.includeAllOrgs) {
      // Admin path
      return ctx.db.query("orgs").collect();
    } else {
      // User path
      return ctx.db.query("orgs").filter(...).collect();
    }
  }
});

// DO: Separate builders
export const listMyOrg = orgQuery({ ... }); // Scoped by orgId
export const listAllOrgs = adminQuery({ ... }); // No scoping
```

**Why:** Makes privilege boundaries visible, easier to audit, type-safe

### Pattern 2: Layout Isolation

**What:** Use pathless layout routes (_admin) to create separate UI trees

**When:** Different sections of app need different navigation, auth, or styling

**Example:**
```
_authenticated/ (MainLayout + AppSidebar)
  ↳ Org-level pages

_admin/ (AdminLayout + AdminSidebar)
  ↳ Admin-level pages
```

**Why:** No layout inheritance conflicts, clear separation of concerns

### Pattern 3: JWT-Based Impersonation

**What:** Generate custom JWT for impersonation with dual identity

**When:** Support team needs to act as users for debugging/support

**Example:**
```typescript
{
  sub: targetUserId,         // Who we're acting as
  adminId: adminUserId,      // Who initiated
  isImpersonation: true,     // Flag for restrictions
  sessionId: uuid(),         // Revocation handle
  exp: now + 1h              // Short lifetime
}
```

**Why:** Stateless (JWT-based), auditable (adminId), secure (short-lived), revocable (sessionId)

### Pattern 4: Custom Function Builders

**What:** Use `customQuery` from convex-helpers to wrap base query/mutation

**When:** Need to inject context, enforce auth, or add middleware-like behavior

**Example:**
```typescript
const adminQuery = customQuery(query, {
  input: async (ctx, args) => {
    await enforceAdmin(ctx);
    return { ctx: { ...ctx, isPlatformAdmin: true }, args };
  }
});
```

**Why:** Reusable, type-safe, explicit, can't be bypassed

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Admin Flag in Org Schema

**What:** Adding `isAdmin: boolean` to org membership role

**Why bad:** Platform admin is separate from org admin. Mixing them:
- Makes revocation harder (need to update all orgs)
- Confuses privilege levels (org vs platform)
- Can't distinguish "admin of Org A" from "platform admin"

**Instead:** Store in WorkOS user metadata, expose via JWT

### Anti-Pattern 2: Shared Layout with Conditional Rendering

**What:** Using same layout for org and admin routes, conditionally showing different sidebars

**Why bad:**
- Shared layout loader runs for both (unnecessary work)
- Tight coupling between org and admin code
- Hard to add admin-specific middleware/checks

**Instead:** Separate layout routes (_authenticated vs _admin)

### Anti-Pattern 3: Session-Based Impersonation Only

**What:** Storing impersonation state only in database, no JWT

**Why bad:**
- Every request requires DB lookup (performance)
- Can't leverage existing JWT validation
- Harder to pass through Convex auth layer

**Instead:** Generate impersonation JWT, store session for audit only

### Anti-Pattern 4: Admin Checks in Every Query

**What:** Copy-pasting admin validation in every function

```typescript
// DON'T
export const listAllOrgs = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user?.is_platform_admin) throw new Error("Admin required");
    // ... rest of function
  }
});
```

**Why bad:** Repetitive, error-prone, hard to update

**Instead:** Use custom query builder that enforces check once

## Scalability Considerations

| Concern | At 10 orgs | At 100 orgs | At 1000 orgs |
|---------|-----------|------------|-------------|
| **Admin org list** | Full table scan OK | Add pagination (limit 50) | Add search/filter indexes |
| **Admin user list** | Full table scan OK | Paginate, filter by org | Paginate + search index |
| **Impersonation JWT** | Store in sessionStorage | Same | Consider token rotation |
| **Audit logs** | Single table | Partition by month | Separate DB or analytics service |
| **Admin queries** | Direct DB queries | Add caching (React Query) | Add Redis cache layer |

## Security Checklist

- [ ] Platform admin flag stored in WorkOS metadata (not client-editable)
- [ ] JWT template exposes admin flag as custom claim
- [ ] Admin route loader checks `is_platform_admin` before rendering
- [ ] Custom query builders enforce admin check at function level
- [ ] Impersonation JWT has short lifetime (1 hour max)
- [ ] Impersonation JWT includes adminId for audit trail
- [ ] Sensitive mutations check `isImpersonation` flag and reject operations
- [ ] Impersonation sessions logged with timestamp, IP, reason
- [ ] Admin console uses HTTPS in production
- [ ] Audit logs retained for compliance (90+ days)
- [ ] Admin actions logged (org views, user views, impersonation starts/ends)

## Testing Strategy

### Unit Tests
- Custom query builder enforces admin check
- Impersonation JWT generation includes correct claims
- Restricted mutations reject operations when `isImpersonation: true`

### Integration Tests
- Non-admin user can't access `/admin` routes (redirected)
- Admin user can access `/admin` routes
- Admin queries return cross-org data
- Org queries still scoped correctly (no regression)

### E2E Tests
- Admin logs in, navigates to admin console, sees org list
- Admin clicks "Impersonate", sees impersonation banner, accesses org app as user
- Admin clicks "End Impersonation", returns to admin console
- Admin tries to change password while impersonating (blocked)

## Open Questions

1. **Should platform admins also have org memberships?**
   - YES: They can test org-level features without impersonation
   - NO: Keeps platform role cleanly separated
   - RECOMMENDATION: Yes, but store separate flag (not tied to org role)

2. **How long should impersonation sessions last?**
   - RECOMMENDATION: 1 hour (short enough for security, long enough for debugging)
   - Add "Extend Session" button if needed

3. **Should impersonation work for other admins?**
   - RECOMMENDATION: No, block impersonating other platform admins (too much power)
   - Add explicit check in `startImpersonation`

4. **Should we log read operations (viewing org details)?**
   - RECOMMENDATION: Yes for compliance, but use lightweight logging (don't log query results, just "admin X viewed org Y")

5. **Should admin console be behind additional auth (2FA)?**
   - RECOMMENDATION: Not initially (rely on WorkOS 2FA), but add MFA requirement in Phase 5 if needed

## Sources

**TanStack Start / Router:**
- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/api/file-based-routing)
- [Routing Concepts](https://tanstack.com/router/v1/docs/framework/react/routing/routing-concepts)
- [Custom Layout for Route Groups](https://dev.to/xb16/custom-layout-for-specific-route-group-in-tanstack-router-solution-2ndp)
- [TanStack Start Routing Guide](https://tanstack.com/start/latest/docs/framework/react/guide/routing)

**Convex:**
- [Custom Functions](https://stack.convex.dev/custom-functions)
- [Authorization Best Practices](https://stack.convex.dev/authorization)
- [convex-helpers README](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md)
- [Internal Functions](https://docs.convex.dev/functions/internal-functions)
- [Row-Level Security](https://stack.convex.dev/row-level-security)

**WorkOS:**
- [User Metadata](https://workos.com/docs/authkit/metadata)
- [Roles and Permissions](https://workos.com/docs/authkit/roles-and-permissions)
- [Users and Organizations](https://workos.com/docs/authkit/users-organizations)

**Impersonation & Security:**
- [User Impersonation Implementation](https://oneuptime.com/blog/post/2026-01-30-impersonation-implementation/view)
- [Multi-Tenant SaaS Architecture](https://www.clickittech.com/software-development/multi-tenant-architecture/)
- [SaaS Security Best Practices 2026](https://gainhq.com/blog/saas-security-best-practices/)
- [JWT Authorization Best Practices](https://www.permit.io/blog/how-to-use-jwts-for-authorization-best-practices-and-common-mistakes)

**Multi-Tenancy:**
- [Multi-Tenant Architecture Patterns](https://www.bytebase.com/blog/multi-tenant-database-architecture-patterns-explained/)
- [Designing Multi-tenant SaaS on AWS](https://www.clickittech.com/software-development/multi-tenant-architecture/)
