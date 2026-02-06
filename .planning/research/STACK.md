# Technology Stack: Admin Console Extensions

**Project:** iSaaSIT Admin Console
**Researched:** 2026-02-06
**Context:** Adding platform admin capabilities to existing TanStack Start + Convex + WorkOS stack

## Executive Summary

The admin console requires minimal new dependencies. Most capabilities can be achieved through architectural patterns and configuration of existing stack components. The primary additions are shadcn charts for visualizations and a simple feature flag approach for progressive rollout.

**Key principle:** Leverage existing stack (TanStack Start routing, WorkOS JWT, Convex auth) rather than adding heavyweight admin frameworks.

## Stack Additions

### Charting & Visualization

| Technology | Version | Purpose | Installation |
|------------|---------|---------|--------------|
| **shadcn/ui chart** | latest | Dashboard metrics visualization | `pnpm dlx shadcn@latest add chart` |
| **recharts** | 2.x (shadcn compatible) | Underlying chart library | Auto-installed with shadcn chart |

**Why shadcn charts:**
- Already using shadcn/ui components, maintains design consistency
- Copy-paste components means full customization control
- Built on Recharts (battle-tested, 24.8K GitHub stars, 3.6M+ npm downloads)
- No abstraction lock-in - can upgrade Recharts independently
- Tailwind CSS integration matches existing styling approach

**Why NOT alternatives:**
- **Tremor:** Acquired by Vercel, good for rapid dashboards but adds another design system. We already have shadcn/ui established.
- **Visx:** Lower-level, requires more custom work. Overkill for standard admin metrics.
- **Nivo:** D3-based, beautiful but heavier bundle. Recharts via shadcn is lighter and sufficient.
- **ECharts:** Powerful but non-React API. Prefer React-native approach.

**Version note:** shadcn/ui currently supports Recharts v2.x stable. They're working on v3 support (Recharts 3.7.0 released Jan 2025). Stay on v2 with shadcn for now, upgrade when shadcn officially supports v3.

**Confidence:** HIGH (verified via official shadcn docs and Recharts releases)

### Feature Flags

| Approach | Implementation | Purpose | When to Use |
|----------|---------------|---------|-------------|
| **React Context + localStorage** | Custom implementation | Progressive admin feature rollout | MVP and early stages |
| **Future: Flagsmith** | Self-hosted OSS | Advanced targeting, A/B testing | Post-MVP if needed |

**Why simple custom implementation first:**
- Admin console features need on/off toggles, not complex targeting
- Small team/single operator context (not managing flags for 1000s of features)
- Can store in localStorage or simple Convex table with `platformFeatures` collection
- Zero external dependencies, full control

**Implementation pattern:**
```typescript
// convex/platformFeatures.ts - simple feature flag table
// flags: [{ key: "admin_impersonation", enabled: true, rollout_percent: 100 }]

// Client: React context wraps admin routes, checks flags
```

**When to upgrade:** If you need percentage rollouts, user targeting, or multiple operators with different flag states, migrate to Flagsmith (self-hosted OSS, no SaaS vendor lock-in).

**Why NOT alternatives:**
- **LaunchDarkly:** SaaS only, no self-hosting. Expensive for small team.
- **Unleash:** Good OSS option but overkill for initial needs. Self-host later if needed.
- **External SaaS flags:** Data residency concerns for platform admin features.

**Confidence:** MEDIUM (WebSearch verified, but simple implementation may vary by team preference)

## Integration Patterns (No New Libraries)

These capabilities leverage existing stack with architectural patterns only.

### Platform Super Admin Authentication

**Approach:** WorkOS JWT custom claims + Convex auth checks

**How it works:**
1. **WorkOS Dashboard:** Configure JWT template with custom claim `platform_role`
2. **Custom claim syntax:** `"platform_role": "{{ user.metadata.platform_role || 'none' }}"`
3. **Set user metadata:** Use WorkOS API to set `user.metadata.platform_role = "super_admin"` for platform admins
4. **Convex auth:** Read custom claims via `ctx.auth.getUserIdentity()`

**Example Convex pattern:**
```typescript
// convex/auth.ts
export const isPlatformAdmin = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    // Custom claims available at dot-notation paths
    return identity["platform_role"] === "super_admin";
  },
});
```

**Why this approach:**
- WorkOS already issues JWTs, no new auth system needed
- Custom claims support confirmed in WorkOS JWT templates (3072 byte limit)
- Convex validates WorkOS JWTs automatically via existing `auth.config.ts`
- Platform role orthogonal to org roles (user can be super admin + member of orgs)

**Alternative rejected:** Adding another auth provider or custom JWT signing. WorkOS custom claims are designed for this use case.

**Confidence:** HIGH (verified via WorkOS official docs on JWT templates and custom claims)

### Admin Route Layout Separation

**Approach:** TanStack Router pathless layout routes

**Pattern:**
```
src/routes/
  _authenticated/        # Existing org-level routes
    dashboard.tsx
    settings.tsx
  _admin/               # New pathless layout for admin
    admin.tsx           # Admin layout with separate sidebar
    _admin/platform/
      dashboard.tsx     # /admin/platform/dashboard
      orgs.tsx          # /admin/platform/orgs
```

**How it works:**
- Pathless layout routes prefixed with `_` wrap children without URL path requirement
- `_admin.tsx` checks `isPlatformAdmin`, renders admin sidebar/layout
- `_admin/` child routes get `/admin/` URL prefix automatically
- Completely separate component tree from `_authenticated/` routes

**Why this approach:**
- TanStack Router native feature, no new libraries
- Clean separation between org-level and platform-level UI
- Reuses existing auth patterns (check role in layout loader)
- File-based routing makes structure obvious

**Alternative rejected:** Single shared layout with conditional rendering. Pathless layouts provide cleaner separation and better code splitting.

**Confidence:** HIGH (verified via TanStack Router official docs and GitHub discussions)

### User/Org Impersonation

**Approach:** JWT token exchange pattern with audit logging

**Architecture:**
1. **Impersonation token:** New token with both identities
   - `sub`: Target user ID (authorization uses this)
   - `impersonator_id`: Admin user ID (audit trail uses this)
   - `session_type`: "impersonation"
   - Shorter expiration (1 hour recommended)
2. **Token generation:** Convex mutation called from admin UI
3. **Client storage:** Store impersonation token in separate state (not main auth)
4. **Audit log:** Convex table logs all impersonation events

**Convex implementation pattern:**
```typescript
// convex/admin.ts
export const startImpersonation = mutation({
  args: { targetUserId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.auth.getUserIdentity();
    if (!admin || admin["platform_role"] !== "super_admin") {
      throw new Error("Unauthorized");
    }

    // Log impersonation start
    await ctx.db.insert("impersonationLogs", {
      adminId: admin.subject,
      targetUserId: args.targetUserId,
      reason: args.reason,
      startedAt: Date.now(),
      sessionType: "impersonation",
    });

    // Return impersonation context (client uses this)
    return {
      targetUserId: args.targetUserId,
      impersonatorId: admin.subject,
      expiresAt: Date.now() + 3600000, // 1 hour
    };
  },
});
```

**Client pattern:**
- Admin UI calls `startImpersonation` mutation
- Store result in React context `ImpersonationContext`
- All Convex calls include impersonation context in args
- Convex functions check `ctx.impersonation` and use `targetUserId` for data access
- Banner in UI shows "Impersonating user@example.com" with exit button

**Security constraints:**
- Block sensitive actions during impersonation (billing changes, password reset)
- Shorter token lifetime (1 hour vs 24 hour for normal sessions)
- Require reason field for audit compliance
- Longer audit log retention (7 years typical for compliance)

**Why this approach:**
- Uses Convex's existing auth primitives
- Audit trail built-in via Convex tables
- No external impersonation service needed
- WorkOS doesn't have native impersonation, so we build it in app layer

**Alternative considered:** WorkOS Directory Sync with impersonation role. Not suitable - WorkOS impersonation is for SCIM/directory sync, not platform admin impersonation.

**Confidence:** HIGH (pattern verified via impersonation architecture articles and JWT best practices)

### Admin Data Access in Convex

**Approach:** Row-level security with platform admin bypass

**Pattern:**
```typescript
// convex/customers.ts
import { isPlatformAdmin } from "./auth";

export const list = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const isAdmin = await isPlatformAdmin(ctx);

    if (isAdmin) {
      // Platform admin: can query across orgs
      if (args.orgId) {
        return await ctx.db
          .query("customers")
          .filter(q => q.eq(q.field("orgId"), args.orgId))
          .collect();
      }
      // No orgId = return all (with pagination in real impl)
      return await ctx.db.query("customers").collect();
    }

    // Regular user: enforce org boundary
    const orgId = identity.org_id;
    return await ctx.db
      .query("customers")
      .filter(q => q.eq(q.field("orgId"), orgId))
      .collect();
  },
});
```

**Key principles:**
- All queries check `isPlatformAdmin` first
- Platform admin can pass `orgId` to query specific org data
- Regular users always filtered to their `identity.org_id`
- Never trust client to send correct orgId without auth check

**Why this approach:**
- Convex Row-Level Security pattern (official Stack article recommendation)
- Authorization co-located with data access (local reasoning)
- No separate admin database or API needed
- Reuses existing org isolation patterns

**Confidence:** HIGH (verified via Convex Stack authorization best practices)

## What NOT to Add

### Admin Dashboard Frameworks
**Don't add:** React Admin, Refine, AdminJS, Forest Admin

**Why not:**
- Opinionated frameworks that don't integrate well with Convex's realtime patterns
- Bring their own routing (conflicts with TanStack Router)
- Designed for CRUD-heavy apps, not SaaS operator tools
- Bundle size overhead for features we won't use

**Our approach:** Build lean admin UI with existing shadcn components and TanStack Router.

### Separate Admin Backend
**Don't add:** Separate Express server, admin-only database, GraphQL admin API

**Why not:**
- Convex functions can handle both org-level and platform-level logic
- Platform admin is a role check, not a different backend
- Separate backend = separate auth, deployment, maintenance burden
- Realtime features (like live org metrics) are Convex's strength

**Our approach:** Single Convex backend with role-based access control.

### Heavy Analytics Libraries
**Don't add:** Cube.js, Metabase, full BI platforms

**Why not:**
- Admin console needs simple metrics (org count, user count, MRR)
- Heavy analytics = SQL dialects, ETL pipelines, separate infrastructure
- Over-engineered for operator dashboard

**Our approach:** Convex aggregation queries + shadcn charts for visualization.

### External Feature Flag SaaS
**Don't add (initially):** LaunchDarkly, Split.io, Optimizely

**Why not:**
- Expensive for small team (LaunchDarkly starts at $8.33/seat/month)
- SaaS-only (LaunchDarkly has no self-hosted option)
- Overkill for on/off toggles of admin features
- Data residency concerns for platform configuration

**Our approach:** Start with simple context-based flags, upgrade to self-hosted Flagsmith only if needed.

## Installation Commands

### Required Dependencies
```bash
# shadcn chart components (includes recharts)
pnpm dlx shadcn@latest add chart

# That's it for npm dependencies
```

### Optional (Post-MVP)
```bash
# If percentage rollouts/targeting needed later
docker run -p 8000:8000 flagsmith/flagsmith:latest  # Self-hosted
```

## Integration with Existing Stack

### TanStack Start
- **No changes needed:** Admin routes use existing file-based routing
- **Pattern:** Add `_admin/` pathless layout alongside `_authenticated/`
- **SSR:** Admin pages can use same SSR patterns as org pages

### WorkOS AuthKit
- **JWT templates:** Add custom claims in WorkOS Dashboard
- **User metadata:** Set `platform_role` via WorkOS API for super admins
- **Sessions:** Same session handling, just check custom claim

### Convex
- **Auth config:** No changes to `convex/auth.config.ts` (already validates WorkOS JWTs)
- **Functions:** Add platform admin checks via `ctx.auth.getUserIdentity()`
- **Tables:** New tables for `impersonationLogs`, `platformFeatures` (feature flags)

### shadcn/ui
- **Charts:** New chart components, same design system
- **Sidebar:** New admin sidebar component (reuse existing `app-sidebar.tsx` patterns)
- **Theme:** Admin pages use same Tailwind theme

### Deployment (Netlify)
- **No changes:** Admin routes deploy with existing build
- **Environment variables:** Add `WORKOS_API_KEY` for user metadata API calls (if not already present)

## Sources

### HIGH Confidence (Official Documentation)
- [WorkOS JWT Templates](https://workos.com/docs/authkit/jwt-templates) - Custom claims syntax
- [WorkOS Roles and Permissions](https://workos.com/docs/authkit/roles-and-permissions) - Role configuration
- [Convex Custom JWT Provider](https://docs.convex.dev/auth/advanced/custom-jwt) - JWT verification
- [Convex WorkOS AuthKit Integration](https://docs.convex.dev/auth/authkit/) - Getting user identity
- [shadcn/ui Chart Component](https://ui.shadcn.com/docs/components/chart) - Installation and usage
- [TanStack Router Pathless Routes](https://tanstack.com/router/v1/docs/framework/react/routing/routing-concepts) - Layout patterns
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization) - RBAC patterns
- [Convex Row-Level Security](https://stack.convex.dev/row-level-security) - Data access patterns

### MEDIUM Confidence (Verified Web Search)
- [Recharts GitHub Releases](https://github.com/recharts/recharts/releases) - Version 3.7.0 latest stable
- [shadcn Recharts v3 Support](https://github.com/shadcn-ui/ui/issues/7669) - Currently on v2, v3 in progress
- [Impersonation Architecture](https://oneuptime.com/blog/post/2026-01-30-impersonation-implementation/view) - Token patterns and audit logging
- [Curity Impersonation Approaches](https://curity.io/resources/learn/impersonation-flow-approaches/) - OAuth impersonation patterns
- [React Feature Flags Patterns](https://medium.com/@ignatovich.dm/implementing-feature-flags-in-react-a-comprehensive-guide-f85266265fb3) - Context-based implementation

### Ecosystem Survey (WebSearch)
- [Top React Chart Libraries 2026](https://technostacks.com/blog/react-chart-libraries/) - Recharts, Tremor, Visx comparison
- [Feature Flag Tools Comparison](https://www.flagsmith.com/blog/launchdarkly-alternatives) - Flagsmith vs LaunchDarkly vs Unleash
- [TanStack Start Admin Dashboards](https://github.com/Kiranism/tanstack-start-dashboard) - Pattern references

## Version Summary

| Dependency | Version | Notes |
|------------|---------|-------|
| recharts | 2.x (exact version from shadcn) | Wait for shadcn v3 support before upgrading |
| shadcn/ui chart | latest | Copy-paste components, no version lock |
| TanStack Router | ^1.158.0 (existing) | No upgrade needed |
| Convex | ^1.31.7 (existing) | No upgrade needed |
| WorkOS Node SDK | ^8.1.0 (existing) | May need user metadata API if not using yet |

## Decision Summary

**Add libraries:** shadcn charts (with Recharts)
**Architectural patterns:** JWT custom claims, pathless layouts, impersonation tokens, row-level security
**Do NOT add:** Admin frameworks, separate backends, heavy analytics, external flag SaaS
**Confidence:** HIGH for auth and routing patterns, MEDIUM for charting library choice (alternatives viable)

This minimal approach keeps the stack lean while enabling full platform admin capabilities. Most complexity is in patterns and authorization logic, not in new dependencies.
