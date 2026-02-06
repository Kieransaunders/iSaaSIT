# Project Research Summary: Admin Console

**Project:** iSaaSIT Admin Console (v2.0)
**Domain:** Platform-level admin console for multi-tenant SaaS
**Researched:** 2026-02-06
**Confidence:** HIGH

## Executive Summary

The admin console is a platform-level management interface added to an existing multi-tenant SaaS starter kit. It enables the SaaS operator (deployer of iSaaSIT) to manage all organizations, impersonate users for support, view cross-org metrics, and configure system settings. Unlike the existing org-level admin features (which manage users within a single org), this operates at a layer above organizations.

**Recommended approach:** Leverage the existing stack (TanStack Start routing, WorkOS JWT custom claims, Convex functions) rather than adding heavyweight admin frameworks. The admin console requires minimal new dependencies—primarily shadcn charts for visualizations. Most capabilities are achieved through architectural patterns: separate route trees (_admin vs _authenticated), custom Convex query builders (adminQuery for cross-org access), and JWT-based impersonation with audit trails.

**Key risks:** The highest-risk areas are privilege escalation vulnerabilities (storing platform admin role incorrectly), tenant isolation bypass (admin queries without proper scoping), and impersonation security (long-lived tokens, missing audit trails, no visual indicators). These risks are amplified because this is a starter kit—any vulnerability ships to every forked deployment. Prevention requires storing platform admin status outside WorkOS org roles, separating admin queries from org queries with explicit builders, enforcing 1-hour impersonation token expiration, and comprehensive audit logging from day one.

## Key Findings

### Stack Additions (from STACK.md)

The admin console integrates with the existing stack (TanStack Start + Convex + WorkOS + Lemon Squeezy) with minimal new dependencies.

**Required additions:**
- **shadcn/ui chart components** (with Recharts 2.x): Dashboard visualizations — chosen because it integrates with existing shadcn design system, provides full customization control via copy-paste components, and avoids heavyweight analytics libraries
- **convex-helpers** (custom query builders): Already likely installed, used for adminQuery/adminMutation builders that enforce platform admin checks

**Architectural patterns (no new libraries):**
- **Platform admin authentication**: WorkOS JWT custom claims + Convex auth checks — store `is_platform_admin` in WorkOS user metadata, expose via JWT template, check in Convex functions
- **Route isolation**: TanStack Router pathless layouts (_admin) — separate route tree with its own layout, sidebar, and auth checks
- **Cross-org data access**: Convex custom query builders — adminQuery wraps base query with platform admin enforcement, removes org scoping
- **User impersonation**: JWT token exchange with audit logging — impersonation token contains both admin ID and target user ID, short expiration (1 hour), comprehensive logging

**What NOT to add:**
- Admin frameworks (React Admin, Refine, AdminJS) — conflicts with TanStack Router, brings opinionated patterns
- Separate admin backend — Convex handles both org-level and platform-level with role checks
- Heavy analytics (Cube.js, Metabase) — overkill for operator dashboard, Convex aggregations sufficient
- External feature flag SaaS (LaunchDarkly) — simple context-based flags adequate for MVP

**Integration confidence:** HIGH — all patterns verified via official Convex, WorkOS, and TanStack Router documentation.

### Expected Features (from ADMIN_CONSOLE_FEATURES.md)

**Must have (table stakes):**
- **Organization management**: List/search/filter all orgs, view org details, suspend/unsuspend org, soft delete org
- **Cross-org user management**: List all users (via WorkOS API), search users, view user details, impersonate user for support
- **Platform metrics dashboard**: Total orgs, active orgs, MRR, churn rate, user counts — real-time via Convex queries
- **Audit trail**: Log all platform admin actions (impersonation, org suspension, deletions), filterable view, export for compliance
- **System configuration**: Global settings (signup enabled, default plan, usage caps), feature flags (simple on/off toggles), webhook logs viewer

**Should have (differentiators for starter kit):**
- **One-click org creation on behalf of**: Pre-create orgs for clients before handoff (agency use case)
- **Impersonation with visual banner**: Persistent amber banner during impersonation reduces admin mistakes
- **Platform health checklist**: Pre-flight checks (WorkOS configured, Lemon Squeezy connected, webhooks working)
- **Quick stats cards**: MRR, churn, active orgs at a glance on dashboard landing

**Defer (v2.1+):**
- Bulk actions (suspend multiple orgs) — single-org operations sufficient for MVP
- Org comparison view — analytics feature, not core operator workflow
- Advanced analytics (cohort analysis, funnels) — use external tools
- Real-time collaboration (multiple admins) — single operator model for v2
- Role-based admin permissions (super admin vs support admin) — single platform admin role in v2

**Build order rationale:** Foundation (admin access) → Org management (read-only) → Audit trail (before mutations) → Lifecycle management (suspend/delete) → Impersonation (support tools) → Metrics (insights) → Configuration (polish).

### Architecture Approach (from ARCHITECTURE.md)

The admin console integrates as a separate route tree with its own authentication layer, layout system, and data access patterns. This maintains clear separation between org-level operations (scoped by orgId) and platform-level operations (cross-org access).

**Major architectural components:**

1. **Route structure**: TanStack Start pathless layout routes
   - `_authenticated/` (existing) — org-level routes with MainLayout + AppSidebar
   - `_admin/` (new) — admin routes with AdminLayout + AdminSidebar
   - Complete separation, no layout inheritance conflicts

2. **Authentication layer**: WorkOS JWT custom claims
   - Store `is_platform_admin: true` in WorkOS user metadata
   - Expose via JWT template custom claim
   - Admin route loader checks claim before rendering
   - Platform admin orthogonal to org roles (can be admin + member of orgs)

3. **Data access**: Convex custom query builders
   - `adminQuery` builder: Enforces platform admin check, allows cross-org queries
   - `orgQuery` builder (existing): Enforces org scoping via orgId filter
   - Explicit separation prevents accidental data leakage

4. **Impersonation system**: JWT-based context switching
   - Generate impersonation JWT with dual identity (adminId + targetUserId)
   - Short expiration (1 hour max)
   - Store session in `impersonationSessions` table for audit
   - Visual banner in UI + restricted actions during impersonation

5. **Build phases** (dependency graph):
   - Phase 1: Foundation (WorkOS metadata, admin routes, admin entry link)
   - Phase 2: Data access (convex-helpers, adminQuery builders, admin Convex functions)
   - Phase 3: Admin UI (layout components, org pages, user pages)
   - Phase 4: Impersonation (schema update, backend, UI, restrictions)
   - Phase 5: Polish (audit logging, error handling, testing)

**Integration points:**
- TanStack Start: Add `_admin/` pathless layout alongside `_authenticated/`, same SSR patterns
- WorkOS: Add JWT template custom claim, set user metadata via API, same session handling
- Convex: No auth config changes (already validates WorkOS JWTs), add platform admin checks in functions
- shadcn/ui: New chart components, reuse existing design system
- Netlify: No deployment changes, admin routes deploy with existing build

**Confidence:** HIGH — verified via official documentation for all integration points.

### Critical Pitfalls (from PITFALLS.md)

Research identified 11 pitfalls (5 critical, 4 moderate, 2 minor). Top 5 critical pitfalls:

1. **Platform admin role stored in org context** (CRITICAL)
   - Problem: Storing `role: "super_admin"` in WorkOS org membership makes it org-scoped, not platform-wide. Multiple orgs could each have "super admins" (privilege escalation).
   - Solution: Store platform admin in separate Convex table `platformAdmins`, check via helper function, never use WorkOS JWT role claim for platform admin.

2. **Admin queries without tenant awareness** (CRITICAL)
   - Problem: Admin writes cross-org query that accidentally leaks all org data to frontend, or RLS rules apply during impersonation blocking cross-org access.
   - Solution: Separate `convex/admin/` directory for unscoped queries, use custom adminQuery builder, always paginate cross-org queries (50-100 limit), separate React Query cache keys.

3. **Impersonation without visual indicators** (CRITICAL)
   - Problem: Admin forgets they're impersonating, makes destructive changes, user sees actions they didn't perform, audit logs show wrong actor.
   - Solution: Persistent amber banner at top, color scheme change (`impersonation-mode` CSS class), browser tab title prefix `[IMPERSONATING]`, modal confirmation for destructive actions.

4. **Impersonation tokens with long expiration** (CRITICAL)
   - Problem: Using same 7-day expiration as regular sessions creates security window for token theft, violates SOC2/PCI DSS requirements.
   - Solution: 1-hour max expiration for impersonation JWT, server-side timeout enforcement (check session creation time in DB), re-authentication required for new session.

5. **No admin action audit trail** (CRITICAL)
   - Problem: Platform admin performs actions but no comprehensive log, can't trace who did what when, SOC2 failure.
   - Solution: Dedicated `adminAuditLogs` table from day one, log admin user ID + impersonated user ID + action + target + timestamp + IP, require reason field for destructive actions, 1-7 year retention.

**Additional moderate pitfalls:**
- Admin routes mixed with org routes (coupling, hard to customize/remove)
- Cross-org queries slow at scale (no pagination/caching/materialized aggregates)
- Admin accidentally modifies production (no confirmation dialogs, environment indicators, or soft delete)
- Admin role granted without verification (exposed mutation, no existing admin approval required)

**Phase-specific warnings:** Each phase has associated pitfall risks documented in PITFALLS.md checklist (security, audit, UX, architecture, performance, bundle size).

## Implications for Roadmap

Based on combined research, the admin console should be built in 5 phases following dependency order and risk mitigation priorities.

### Phase 1: Platform Admin Foundation
**Rationale:** Establish platform admin identification before building any admin features. This phase sets up the authentication layer that all subsequent phases depend on.

**Delivers:**
- Platform admin role stored in Convex (not WorkOS org role)
- WorkOS user metadata + JWT template custom claim configured
- Admin route structure (`_admin/` pathless layout)
- Admin entry link in existing org sidebar (visible only to admins)
- Basic admin dashboard landing page

**Addresses (from FEATURES.md):**
- Platform admin access control (table stakes)

**Avoids (from PITFALLS.md):**
- Pitfall 1: Platform admin role stored in org context (store in Convex instead)
- Pitfall 9: Admin role granted without verification (use internalMutation for initial setup)

**Stack elements used:**
- WorkOS user metadata API
- WorkOS JWT template configuration
- TanStack Router pathless layouts
- Convex platformAdmins table

**Research needed:** None — standard patterns, well-documented

---

### Phase 2: Read-Only Organization Management
**Rationale:** Build cross-org data access before mutations. Allows testing admin query patterns without risk of data modification.

**Delivers:**
- Install convex-helpers library
- Custom adminQuery builder with platform admin enforcement
- List all organizations (paginated)
- Search/filter orgs (by name, status, plan)
- View org details page (WorkOS data + Convex subscription data)
- Org detail includes: user count, subscription status, customer count, created date

**Addresses (from FEATURES.md):**
- Organization management (list/search/view) — table stakes

**Avoids (from PITFALLS.md):**
- Pitfall 2: Admin queries without tenant awareness (separate admin queries, use pagination)
- Pitfall 6: Admin routes mixed with org routes (separate _admin/ directory)
- Pitfall 7: Cross-org queries slow at scale (pagination from start)

**Stack elements used:**
- convex-helpers custom query builders
- shadcn/ui Table component
- Convex pagination APIs

**Research needed:** None — Convex pagination well-documented

---

### Phase 3: Audit Trail Foundation
**Rationale:** Build audit infrastructure BEFORE implementing any destructive mutations. Critical for compliance and security.

**Delivers:**
- `adminAuditLogs` Convex table
- `auditAdminAction` helper function
- Admin audit log viewer page (filterable by admin, action type, date)
- Export audit log to CSV
- Retention policy documented (1 year minimum for SOC2)

**Addresses (from FEATURES.md):**
- Audit trail system (table stakes)

**Avoids (from PITFALLS.md):**
- Pitfall 5: No admin action audit trail (build before mutations)

**Stack elements used:**
- Convex tables with indexes
- shadcn/ui Table + filters
- CSV export utility

**Research needed:** None — standard audit table patterns

---

### Phase 4: Organization Lifecycle Management
**Rationale:** Add mutation capabilities now that audit trail is in place. Org suspension is the most common platform admin action.

**Delivers:**
- Suspend organization (with reason field, audit logging)
- Unsuspend organization
- Soft delete organization (marks deleted, retains data 30 days)
- Org status badges in UI (Active/Suspended/Cancelled/Deleted)
- Confirmation dialogs with typing requirement for destructive actions
- Environment indicator banner (Production vs Staging)

**Addresses (from FEATURES.md):**
- Organization lifecycle management (table stakes)

**Avoids (from PITFALLS.md):**
- Pitfall 8: Admin accidentally modifies production (confirmation dialogs, environment banners, soft delete)

**Stack elements used:**
- Convex mutations with adminMutation builder
- WorkOS session invalidation (for suspend)
- shadcn/ui AlertDialog

**Research needed:** Medium — WorkOS session invalidation API (may need to verify if WorkOS supports org-wide session invalidation)

---

### Phase 5: User Impersonation & Support Tools
**Rationale:** Impersonation is security-critical. Build after core admin features are stable and audit trail is proven.

**Delivers:**
- Impersonation backend (JWT generation with dual identity)
- `impersonationSessions` Convex table
- Impersonation UI (user search + "Impersonate" button)
- Persistent impersonation banner (amber, always visible)
- Impersonation token with 1-hour expiration
- Server-side timeout enforcement
- Restricted actions during impersonation (block password changes, deletions)
- End impersonation flow
- Impersonation session logging in audit trail

**Addresses (from FEATURES.md):**
- User impersonation (table stakes)
- Cross-org user management (list users, search)

**Avoids (from PITFALLS.md):**
- Pitfall 3: Impersonation without visual indicators (persistent banner, color scheme, tab title)
- Pitfall 4: Long-lived impersonation tokens (1-hour max, server-side enforcement)

**Stack elements used:**
- Convex actions for JWT generation
- JWT signing library (jose)
- React context for impersonation state
- shadcn/ui Banner component

**Research needed:** High — JWT token signing in Convex actions, WorkOS session handling during impersonation. Recommend `/gsd:research-phase` for this phase.

---

### Phase 6: Platform Metrics Dashboard
**Rationale:** Metrics provide observability but aren't blocking for core workflows. Build after org management and impersonation are functional.

**Delivers:**
- shadcn/ui chart components installed
- Platform overview dashboard with quick stats cards
- Total orgs count (Active/Suspended/Total)
- MRR calculation (sum of active Lemon Squeezy subscriptions)
- Churn rate (requires time-series tracking)
- New orgs last 30 days
- Active orgs last 7 days (requires activity tracking)
- Usage by plan tier chart
- Real-time updates via Convex subscriptions

**Addresses (from FEATURES.md):**
- Platform metrics dashboard (table stakes)
- Quick stats cards (differentiator)

**Avoids (from PITFALLS.md):**
- Pitfall 11: Stale dashboard data (real-time Convex subscriptions, timestamp display)
- Pitfall 7: Cross-org aggregations slow (materialized metrics table, caching)

**Stack elements used:**
- shadcn/ui chart components
- Recharts 2.x (via shadcn)
- Convex real-time subscriptions
- Lemon Squeezy subscription data

**Research needed:** Medium — Activity tracking strategy (how granular to track), Lemon Squeezy subscription aggregation APIs

---

### Phase 7: System Configuration & Polish
**Rationale:** Configuration features are lower priority than core admin workflows. Add after metrics provide visibility.

**Delivers:**
- System settings page (global config, not per-org)
- Feature flags table with toggle UI
- Webhook logs viewer (Lemon Squeezy + WorkOS events)
- Webhook retry for failed events
- Error boundaries for admin routes
- Loading states for admin queries
- Admin console lazy loading (code splitting)

**Addresses (from FEATURES.md):**
- System configuration (table stakes)
- Webhook logs viewer (table stakes)
- Feature flags (nice to have)

**Avoids (from PITFALLS.md):**
- Pitfall 10: Admin bloats org bundle (lazy loading, code splitting)

**Stack elements used:**
- Vite manual chunks configuration
- React lazy loading
- Convex webhookEvents table

**Research needed:** Low — standard configuration patterns

---

### Phase Ordering Rationale

**Dependency-driven order:**
- Foundation (Phase 1) → Data access (Phase 2) → Audit (Phase 3) → Mutations (Phase 4) follows natural dependency chain
- Audit trail must exist before destructive mutations (compliance)
- Impersonation requires stable admin backend (security-critical, high-risk)

**Risk mitigation order:**
- Critical pitfalls addressed in early phases (admin role storage, query separation, audit trail)
- Impersonation isolated in dedicated phase due to security complexity
- Metrics and configuration deferred until core workflows proven

**Architectural grouping:**
- Phases 1-3: Infrastructure (auth, queries, audit)
- Phases 4-5: Core operations (lifecycle management, impersonation)
- Phases 6-7: Observability & polish (metrics, configuration)

**Forker friendliness:**
- Clear separation by phase makes admin console removable
- Early phases establish patterns that later phases follow
- Each phase delivers working functionality (not scaffolding)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Org Lifecycle)**: WorkOS session invalidation API — verify if WorkOS supports org-wide session invalidation or requires per-user session revocation. Medium priority.
- **Phase 5 (Impersonation)**: JWT signing in Convex + WorkOS session handling during impersonation — complex security surface, recommend `/gsd:research-phase` for implementation patterns. High priority.
- **Phase 6 (Metrics)**: Activity tracking strategy + Lemon Squeezy aggregation — need to determine granularity (query-level vs mutation-level tracking) and performance impact. Medium priority.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: WorkOS metadata API well-documented, TanStack Router pathless layouts standard
- **Phase 2 (Read-Only Org Management)**: Convex pagination patterns well-established
- **Phase 3 (Audit Trail)**: Standard audit table schema, no novel patterns
- **Phase 7 (Configuration)**: Simple CRUD with validation, standard patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All integration points verified via official docs (WorkOS, Convex, TanStack Router). shadcn charts confirmed compatible with Recharts 2.x. |
| Features | HIGH | Table stakes validated via multiple SaaS admin panel examples (Stripe, Clerk, WorkOS). Impersonation patterns confirmed via Auth0, PropelAuth, Frontegg docs. |
| Architecture | HIGH | TanStack Router pathless layouts, Convex custom functions, WorkOS JWT custom claims all officially documented. Pattern references found in Convex Stack blog. |
| Pitfalls | HIGH | Security pitfalls verified via OWASP session management, multi-tenant leakage research, SOC2 compliance requirements. Impersonation risks confirmed via multiple security sources. |

**Overall confidence:** HIGH

### Gaps to Address

**Activity tracking implementation:** Research identified need to track "active orgs" (orgs with user activity in last 7 days) but didn't specify exact implementation. Two options:
- **Option A**: Update `lastActivityAt` timestamp on org record via Convex middleware (every query)
- **Option B**: Track activity in separate events table, aggregate on-demand
- **Recommendation**: Option A for simplicity, Option B if performance issues. Validate during Phase 6 planning.

**WorkOS session invalidation scope:** PITFALLS.md mentions "WorkOS session invalidation" for org suspension but doesn't confirm if WorkOS API supports org-wide invalidation or requires per-user loop.
- **Validation needed**: Check WorkOS API docs during Phase 4 planning
- **Fallback**: If no org-wide API, store sessions in Convex and invalidate manually

**Impersonation restricted actions list:** ADMIN_CONSOLE_FEATURES.md suggests read-only impersonation, but use cases may require write access (e.g., reproducing bug requires creating customer record).
- **Decision needed**: Read-only vs full access with audit trail
- **Recommendation**: Start read-only (Phase 5 MVP), add write access in Phase 5.1 if needed

**Hard delete vs soft delete:** FEATURES.md defers hard delete to v2.1+, PITFALLS.md recommends 30-90 day soft delete retention.
- **Compliance check**: GDPR "right to be forgotten" may require hard delete on request
- **Recommendation**: Soft delete with 30-day retention in Phase 4, add manual hard delete in admin UI for compliance requests

## Sources

### Primary (HIGH confidence)
**Stack & Architecture:**
- [WorkOS JWT Templates](https://workos.com/docs/authkit/jwt-templates) — Custom claims syntax
- [WorkOS User Metadata](https://workos.com/docs/authkit/metadata) — Metadata API
- [Convex Custom Functions](https://stack.convex.dev/custom-functions) — Custom query builders
- [Convex WorkOS AuthKit Integration](https://docs.convex.dev/auth/authkit/) — Getting user identity
- [TanStack Router Pathless Routes](https://tanstack.com/router/v1/docs/framework/react/routing/routing-concepts) — Layout patterns
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization) — RBAC patterns
- [Convex Row-Level Security](https://stack.convex.dev/row-level-security) — Data access patterns
- [shadcn/ui Chart Component](https://ui.shadcn.com/docs/components/chart) — Installation and usage
- [Recharts GitHub Releases](https://github.com/recharts/recharts/releases) — Version 3.7.0 latest, shadcn on v2

**Features & Best Practices:**
- [PropelAuth User Impersonation Docs](https://docs.propelauth.com/overview/user-management/user-impersonation) — Impersonation patterns
- [Frontegg User Impersonation Guide](https://developers.frontegg.com/guides/management/manage-users/impersonation) — Security requirements
- [Clerk Dashboard Overview](https://clerk.com/docs/guides/dashboard/overview) — Admin panel patterns
- [Airtable Admin Panel](https://support.airtable.com/docs/overview-of-the-admin-panel) — Feature examples

**Compliance & Security:**
- [Session Management - OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — Timeout requirements
- [SOC 2 Compliance Requirements - Secureframe](https://secureframe.com/hub/soc-2/requirements) — Audit retention
- [Audit Logs for SaaS Enterprise Customers - Frontegg](https://frontegg.com/blog/audit-logs-for-saas-enterprise-customers) — Audit fields

### Secondary (MEDIUM confidence)
**Impersonation Implementation:**
- [User Impersonation Implementation - OneUpTime](https://oneuptime.com/blog/post/2026-01-30-impersonation-implementation/view) — Token patterns, audit logging
- [Building Secure User Impersonation - Medium](https://medium.com/@codebyzarana/building-a-secure-user-impersonation-feature-for-multi-tenant-enterprise-applications-21e79476240c) — Enterprise patterns
- [User Impersonation Security Risks - Authress](https://authress.io/knowledge-base/academy/topics/user-impersonation-risks) — Risk mitigation

**Multi-Tenancy Pitfalls:**
- [Multi-Tenant Leakage: When Row-Level Security Fails - Medium](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c) — RLS bypass patterns
- [Privilege Escalation Attacks and SaaS Cloud Security - Archive360](https://www.archive360.com/blog/privilege-escalation-attacks-and-the-saas-cloud) — Privilege escalation vectors
- [SaaS Privilege Escalation - AppOmni](https://appomni.com/blog/saas-privilege-escalation-and-threat-detection/) — Detection strategies

**Platform Metrics:**
- [12 Key SaaS Metrics 2026 - ThoughtSpot](https://www.thoughtspot.com/data-trends/dashboard/saas-metrics-kpis) — KPI definitions
- [10 Best SaaS KPIs - Plecto](https://www.plecto.com/blog/sales-performance/10-saas-kpis-you-should-focus/) — MRR, churn calculations

**Scalability:**
- [Scaling Multi-Tenant Databases - Redmond Magazine](https://redmondmag.com/articles/2025/09/16/scaling-databases-for-large-multi-tenant-applications.aspx) — Cross-shard query performance
- [Weaviate Multi-Tenancy Architecture](https://weaviate.io/blog/weaviate-multi-tenancy-architecture-explained) — Pagination strategies

### Tertiary (LOW confidence)
- Feature flag tool comparisons (LaunchDarkly vs Flagsmith vs custom) — needs validation during implementation
- React chart library comparisons (Recharts vs Tremor vs Visx) — shadcn charts chosen but alternatives viable

---

**Research completed:** 2026-02-06
**Ready for roadmap:** Yes
**Recommended starting point:** Phase 1 (Platform Admin Foundation)
**Critical research gap:** Phase 5 (Impersonation) — recommend `/gsd:research-phase` for JWT signing + session handling implementation details
