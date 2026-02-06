# Features Research: Platform Admin Console

**Domain:** Multi-tenant SaaS Platform Administration
**Researched:** 2026-02-06
**Milestone:** v2.0 Admin Console
**Overall Confidence:** MEDIUM

## Executive Summary

Platform admin consoles serve the SaaS operator (the person/team who deployed iSaaSIT) to manage all organizations, troubleshoot user issues, monitor platform health, and configure system-wide settings. Unlike org-level admin features (already built), platform admin operates at a layer above organizations with cross-org visibility and impersonation capabilities.

**Key finding:** Modern SaaS platforms (Stripe, Clerk, WorkOS, Retool) provide admin panels focused on operational efficiency, not just raw data access. Features cluster around: **Org lifecycle management**, **User impersonation for support**, **Platform KPI dashboards**, **System configuration**, and **Audit trails for compliance**.

## Table Stakes Features

Features expected in ANY platform admin console. Missing these makes troubleshooting painful or impossible.

### Organization Management

| Feature | Complexity | Dependencies | Notes |
|---------|------------|--------------|-------|
| List all organizations | Low | Existing Convex org table | Paginated table with search |
| Search orgs (by name, ID, email) | Low | None | Full-text search preferred |
| Filter orgs (by status, plan, date) | Medium | Subscription data | Active/Suspended/Cancelled states |
| View org details | Low | WorkOS API integration | WorkOS data + Convex subscription data |
| Suspend organization | High | Org status field, access control | Blocks all org users from signing in |
| Unsuspend organization | Medium | Same as suspend | Restore access after suspension |
| Delete organization (soft) | High | Data retention policy, cascade rules | Mark deleted, retain data 30-90 days |
| Impersonate org admin | High | WorkOS session management | Act as specific org admin user |

**Complexity notes:**
- **Suspend/Unsuspend**: Requires WorkOS session invalidation + Convex status checks in all queries
- **Delete**: Must handle cascade (customers, assignments) + data retention compliance
- **Impersonate**: Security critical - needs audit trail, visual indicators, session isolation

### User Management (Cross-Org)

| Feature | Complexity | Dependencies | Notes |
|---------|------------|--------------|-------|
| List all users (cross-org) | Medium | WorkOS Directory API | Federated query across all orgs |
| Search users (by email, name, ID) | Low | WorkOS API | Search within WorkOS |
| View user details | Low | WorkOS + Convex user data | Org membership, role, activity |
| Impersonate any user | High | WorkOS session + audit trail | Act as specific user for debugging |
| Suspend user account | Medium | WorkOS API | Block user from all orgs |
| Reset user password | Low | WorkOS API | Force password reset flow |
| View user activity log | Medium | Activity tracking (not built yet) | Last login, recent actions |

**Critical constraint:** WorkOS manages user directory. Platform admin uses WorkOS APIs, doesn't duplicate user storage in Convex.

### Platform Metrics Dashboard

| Feature | Complexity | Dependencies | Notes |
|---------|------------|--------------|-------|
| Total orgs count | Low | Convex query | Active/Suspended/Total |
| Total users count | Medium | WorkOS API aggregation | Cross-org user count |
| MRR (Monthly Recurring Revenue) | Medium | Lemon Squeezy subscription data | Sum of active subscriptions |
| Churn rate | Medium | Historical subscription data | Requires time-series tracking |
| New orgs (last 30 days) | Low | Convex query with date filter | Signup trend |
| Active orgs (last 7 days) | Medium | Activity tracking | Requires session/action logging |
| ARPU (Average Revenue Per User) | Low | MRR / user count | Calculated metric |
| Usage by plan tier | Low | Subscription plan aggregation | Free/Pro/Enterprise breakdown |

**Data source:** Mix of Convex (org/subscription data) and Lemon Squeezy webhooks (payment events). Requires subscription event history.

### Audit Trail

| Feature | Complexity | Dependencies | Notes |
|---------|------------|--------------|-------|
| Log all platform admin actions | High | New audit log system | Who did what when (admin actions only) |
| View audit log (filterable) | Medium | Audit log query UI | Filter by admin, action type, date |
| Impersonation session logging | High | Impersonation feature | Track start/end, actions taken during impersonation |
| Export audit log | Low | CSV/JSON download | Compliance requirement |

**Compliance requirement:** GDPR/CCPA/SOC2 require audit trails for privileged actions. Retention: 1-7 years depending on regulation.

**Critical fields:**
- Admin user ID (who performed action)
- Impersonated user ID (if impersonating)
- Action type (org.suspend, user.impersonate, etc)
- Target resource (org ID, user ID)
- Timestamp (ISO 8601 UTC)
- Result (success/failure)
- IP address (optional but recommended)

### System Configuration

| Feature | Complexity | Dependencies | Notes |
|---------|------------|--------------|-------|
| View current system settings | Low | Convex settings table | Global config (not per-org) |
| Update system settings | Medium | Settings mutation + validation | With confirmation dialogs |
| Manage billing plans | Medium | Lemon Squeezy product/variant sync | Add/edit plan metadata |
| View webhook logs | Medium | Webhook event storage | Lemon Squeezy + WorkOS webhooks |
| Retry failed webhooks | Medium | Webhook retry queue | Manual retry for debugging |

**System settings examples:**
- Allow new org signups (boolean)
- Default plan for new orgs
- Usage cap defaults (maxCustomers, maxStaff, maxClients per plan)
- Feature flags (toggle features without deploy)
- Maintenance mode (block all access except platform admin)

## Differentiators (Competitive Advantage for Starter Kit)

Features that make iSaaSIT's admin console better than competitors.

| Feature | Complexity | Value | Why It's a Differentiator |
|---------|------------|-------|---------------------------|
| One-click org creation (on behalf of) | Medium | High | Agencies deploying iSaaSIT can pre-create orgs for clients before handoff |
| Impersonation with screenshot mode | High | High | Take screenshots while impersonating to share with user - reduces "send me a screenshot" support friction |
| Platform health checklist | Medium | High | Pre-flight checks (WorkOS connected, Lemon Squeezy configured, webhooks working) - reduces setup errors |
| Visual org lifecycle diagram | Low | Medium | Flowchart showing org state transitions (Active → Suspended → Cancelled → Deleted) with timelines |
| Bulk actions (suspend/unsuspend multiple orgs) | Medium | Medium | For emergency situations or mass updates |
| Org comparison view | Medium | Medium | Side-by-side comparison of 2-3 orgs (plan, usage, activity) for analyzing patterns |
| Activity heatmap | Medium | Low | Visual representation of when orgs are most active (helps with scaling/maintenance windows) |
| Quick stats cards | Low | High | MRR, churn, active orgs at a glance on dashboard landing |

**Rationale:** Most SaaS starters provide raw admin tables with no UX. Differentiating on **operator ergonomics** (fast troubleshooting, visual insights, pre-flight checks) makes iSaaSIT faster to operate.

## Anti-Features (Do NOT Build)

Features to deliberately exclude to avoid scope creep.

| Feature | Why Exclude |
|---------|-------------|
| Custom dashboards with drag-drop widgets | High complexity, low ROI. Operators learn the fixed dashboard quickly. |
| Advanced analytics (cohort analysis, funnels) | Use external tools (Mixpanel, Amplitude). Not core to admin console. |
| In-app messaging to users | Use email (Resend) or support tool (Intercom). Admin console shouldn't be a CRM. |
| Real-time collaboration (multiple admins) | Single operator or small team model. Real-time adds websocket complexity. |
| Scheduled reports/exports | Email automation adds infrastructure. Manual export is sufficient for v2. |
| Multi-language admin UI | Operator is typically English-speaking. Internationalization deferred to v3+. |
| Role-based admin permissions (super admin vs support admin) | Single platform admin role in v2. Revisit if multiple operators need different access levels. |
| Custom SQL query builder | Security risk. Provide pre-built queries only. |
| Org billing overrides (manual adjustments) | Handle via Lemon Squeezy dashboard directly. Admin console mirrors data, doesn't manage billing. |
| Feature flag scheduling (enable at specific time) | Feature flags are manual toggle only. Time-based rollout adds cron complexity. |
| Webhook replay for all events | Only retry failed webhooks. Full replay requires event sourcing architecture. |
| Data export for entire platform | Too slow, privacy risk. Export per-org only. |

## Feature Dependencies

```
Platform Admin Access (new)
    ├── Organization Management
    │   ├── List/Search/Filter orgs
    │   ├── Suspend/Unsuspend org → Requires org status field + access control
    │   └── Delete org → Requires data retention policy + cascade rules
    │
    ├── User Management (Cross-Org)
    │   ├── List/Search users → Requires WorkOS Directory API integration
    │   └── Impersonate user → Requires session isolation + audit trail
    │
    ├── Platform Metrics Dashboard
    │   ├── MRR/Churn → Requires Lemon Squeezy subscription history
    │   └── Active orgs → Requires activity tracking (new feature)
    │
    ├── Audit Trail (new system)
    │   └── All admin actions must write to audit log
    │
    └── System Configuration
        ├── Feature flags → Requires feature flag storage + runtime checks
        └── Webhook logs → Requires webhook event storage
```

**Build order:**
1. Platform admin role + access control
2. Org list/search/view (read-only)
3. Audit trail foundation (before any mutations)
4. Org suspend/unsuspend
5. User impersonation
6. Platform metrics
7. System configuration

## Implementation Patterns

### User Impersonation Security

Based on best practices research, impersonation must:

1. **Session Isolation**: Impersonation session is separate from admin's session. Token carries both identities:
   - `originalAdminId`: For audit trail
   - `impersonatedUserId`: For authorization checks

2. **Visual Indicators**: Sticky banner at top of screen when impersonating:
   ```
   [!] You are impersonating john@example.com [End Session]
   ```

3. **Time Limits**: Impersonation tokens expire after 1 hour (shorter than regular sessions). Forces admins to re-authenticate if troubleshooting takes longer.

4. **Audit Logging**: Every action during impersonation logs:
   - Admin who initiated impersonation
   - User being impersonated
   - Action taken
   - Timestamp

5. **Restricted Actions**: Even when impersonating, cannot:
   - Delete org
   - Change billing
   - Invite/remove users
   - (Read-only troubleshooting mode)

### Org Suspension Pattern

**Suspension workflow:**
1. Admin marks org as `suspended` in Convex
2. All org users' sessions invalidated via WorkOS API
3. On next request, loader checks org status → redirect to suspended page
4. Suspended page shows reason + contact info (operator configured)
5. To unsuspend: Admin clicks "Restore Access" → status = active → users can sign in again

**Data retention:**
- Suspended orgs: Data retained indefinitely (can be restored)
- Deleted orgs: Soft delete, data retained 30-90 days (configurable), then hard delete

### Platform Metrics Calculation

**MRR calculation:**
```typescript
// Sum of active subscriptions
const activeSubscriptions = await lemonSqueezy.listSubscriptions({ status: 'active' })
const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.price, 0)
```

**Churn rate calculation:**
```typescript
// (Cancelled subscriptions in period) / (Active subscriptions at start of period)
const startOfMonth = new Date(2026, 1, 1)
const cancelledThisMonth = await convex.query('subscriptions:listCancelled', { since: startOfMonth })
const activeAtStart = await convex.query('subscriptions:countActive', { date: startOfMonth })
const churnRate = (cancelledThisMonth.length / activeAtStart) * 100
```

**Active orgs calculation:**
Requires activity tracking. Define "active" as: org had at least one user session in last 7 days.
- Store `lastActivityAt` timestamp on org record
- Update on every user action (via Convex middleware)
- Query: `orgs where lastActivityAt >= now() - 7 days`

### Feature Flags Implementation

**Storage:**
```typescript
// Convex table: featureFlags
{
  _id: Id<"featureFlags">,
  key: string, // e.g., "enableBetaFeature"
  enabled: boolean,
  description: string,
  _creationTime: number
}
```

**Runtime check:**
```typescript
// In application code
const flags = await ctx.db.query('featureFlags').collect()
const enableBetaFeature = flags.find(f => f.key === 'enableBetaFeature')?.enabled ?? false

if (enableBetaFeature) {
  // Show beta feature
}
```

**Admin UI:**
- Simple table: Feature name | Enabled (toggle) | Description
- Toggle immediately updates Convex, no deploy needed
- No scheduling, no percentage rollouts (v2 simplicity)

### Webhook Logs Viewer

**Storage:**
```typescript
// Convex table: webhookEvents
{
  _id: Id<"webhookEvents">,
  source: string, // 'lemonSqueezy' | 'workos'
  eventType: string, // e.g., 'subscription_updated'
  payload: object, // Full webhook payload
  status: string, // 'success' | 'failed'
  error?: string, // If failed
  processedAt: number, // Timestamp
}
```

**Admin UI:**
- Table: Source | Event Type | Status | Timestamp
- Click row → View full payload (JSON viewer)
- If failed → "Retry" button → Re-process webhook

**Why this matters:** Webhook failures are common (network issues, bugs). Being able to see what webhooks arrived and retry failures is critical for billing/user sync reliability.

## Org Lifecycle States

```
[Created] → User signs up, completes onboarding
    ↓
[Active] → Org operates normally
    ↓ (admin action)
[Suspended] → Blocks access, retains data (reversible)
    ↓ (admin action OR subscription cancelled)
[Cancelled] → Subscription ended, grace period (30 days)
    ↓ (after grace period)
[Deleted (soft)] → Marked deleted, data retained 30-90 days for recovery
    ↓ (after retention period)
[Deleted (hard)] → Data purged, irreversible
```

**State transitions:**
- Active ↔ Suspended: Admin action (emergency suspension or restore)
- Active → Cancelled: Subscription cancellation webhook from Lemon Squeezy
- Cancelled → Deleted: Automatic after grace period OR admin force-delete
- Deleted (soft) → Active: Admin restore (within retention window)
- Deleted (soft) → Deleted (hard): Automatic after retention period

## MVP Recommendation for v2.0

For v2.0 Admin Console MVP, prioritize:

### Phase 1: Foundation (Must Have)
1. Platform admin role + protected `/admin` route
2. Org list/search/filter (read-only)
3. View org details
4. Audit trail system (before any mutations)

### Phase 2: Lifecycle Management (Must Have)
5. Suspend/unsuspend org
6. Soft delete org
7. Org status badges in UI

### Phase 3: Support Tools (Must Have)
8. User impersonation (view-only mode)
9. Impersonation audit logging
10. Visual impersonation indicator

### Phase 4: Insights (Nice to Have)
11. Platform metrics dashboard (MRR, orgs, users)
12. Quick stats cards
13. Activity tracking

### Phase 5: Configuration (Nice to Have)
14. Feature flags (simple toggle)
15. Webhook logs viewer
16. System settings (global config)

**Defer to v2.1+:**
- Bulk actions
- Org comparison view
- Activity heatmap
- Webhook retry
- Hard delete (soft delete sufficient for v2.0)

**Rationale:** Phase 1-3 enable core platform operator workflows (manage orgs, troubleshoot as user). Phase 4-5 add observability/configuration. Without Phase 1-3, operator cannot support users effectively.

## Complexity Assessment

| Category | Overall Complexity | Risk Areas |
|----------|-------------------|------------|
| Org Management | Medium | Suspend logic must invalidate WorkOS sessions |
| User Impersonation | High | Session isolation, security, audit trail |
| Platform Metrics | Medium | Requires activity tracking (new feature) |
| Audit Trail | High | Must be append-only, tamper-proof |
| System Configuration | Low | CRUD with validation |
| Webhook Logs | Low | Storage + display, retry is medium |

**Highest risk:** User impersonation. Security-critical feature. Must:
- Never leak admin session to impersonated user
- Always log impersonation actions
- Provide clear visual indicators
- Enforce time limits
- Restrict dangerous actions

## Open Questions for Phase Planning

1. **Activity Tracking:** How granular? Track every Convex query (expensive) or just mutations (cheaper)?
2. **WorkOS Session Invalidation:** Does WorkOS API support invalidating all sessions for an org? Or must we store sessions in Convex?
3. **Impersonation Restrictions:** View-only mode vs full access? Recommend view-only for v2.
4. **Data Retention:** 30 days, 60 days, or 90 days for soft-deleted orgs? Depends on compliance requirements (GDPR = 30 days recommended).
5. **Audit Log Retention:** 1 year, 3 years, or 7 years? SOC2 = 1 year minimum, financial services = 7 years.

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| Table Stakes Features | HIGH | Verified via multiple SaaS admin panels (Stripe, Clerk, WorkOS patterns) + starter kit examples |
| Impersonation Security | HIGH | Official best practices from WorkOS, Auth0, PropelAuth documentation |
| Platform Metrics | MEDIUM | Web search results confirmed standard KPIs, but calculation specifics vary by platform |
| Audit Trail Requirements | HIGH | GDPR/CCPA/SOC2 compliance standards are well-documented |
| Feature Flag Patterns | MEDIUM | Multiple tools (LaunchDarkly, Flagsmith) surveyed, but simple toggle approach is custom |
| Org Lifecycle States | MEDIUM | Based on SaaS subscription lifecycle patterns, not platform-specific docs |

## Sources

### Table Stakes & Ecosystem
- [SaaS Management Platforms Overview](https://www.bettercloud.com/monitor/what-is-a-saas-management-platform/)
- [SaaS User Management Guide 2026](https://www.zluri.com/blog/saas-user-management)
- [Admin Dashboard Guide 2026](https://www.weweb.io/blog/admin-dashboard-ultimate-guide-templates-examples)

### User Impersonation
- [Building Secure User Impersonation](https://medium.com/@codebyzarana/building-a-secure-user-impersonation-feature-for-multi-tenant-enterprise-applications-21e79476240c)
- [User Impersonation Implementation](https://oneuptime.com/blog/post/2026-01-30-impersonation-implementation/view)
- [PropelAuth User Impersonation Docs](https://docs.propelauth.com/overview/user-management/user-impersonation)
- [Frontegg User Impersonation Guide](https://developers.frontegg.com/guides/management/manage-users/impersonation)
- [Multi-Tenant Authorization Best Practices](https://www.permit.io/blog/best-practices-for-multi-tenant-authorization)

### Platform Metrics & KPIs
- [12 Key SaaS Metrics 2026](https://www.thoughtspot.com/data-trends/dashboard/saas-metrics-kpis)
- [10 Best SaaS KPIs](https://www.plecto.com/blog/sales-performance/10-saas-kpis-you-should-focus/)
- [SaaS Dashboard Components](https://www.klipfolio.com/resources/dashboard-examples/saas)
- [SaaS Monitoring Guide 2026](https://blog.incidenthub.cloud/monitoring-saas-status-2026-complete-guide)

### Audit Trails & Compliance
- [Audit Trail Requirements Guide](https://www.inscopehq.com/post/audit-trail-requirements-guidelines-for-compliance-and-best-practices)
- [Audit Trail Checklist 2026](https://sprinto.com/blog/audit-trail/)
- [Privileged Access Management Audit](https://www.strongdm.com/blog/how-to-audit-privileged-access-management)
- [HIPAA Audit Trail Requirements](https://auditboard.com/blog/hipaa-audit-trail-requirements)

### Feature Flags & System Config
- [17 Best Feature Flag Tools 2026](https://cpoclub.com/tools/best-feature-flag-software/)
- [Feature Flag Management Tools](https://www.kameleoon.com/blog/top-feature-flag-management-tools)
- [Flagsmith Open Source](https://www.flagsmith.com/)

### Webhook & Event Logs
- [Square Webhook Event Logs](https://developer.squareup.com/docs/devtools/webhook-logs)
- [FusionAuth Webhook Event Log](https://fusionauth.io/docs/extend/events-and-webhooks/webhook-event-log)
- [Adyen Webhook Event Logs](https://docs.adyen.com/development-resources/logs-resources/webhook-event-logs)

### Org Lifecycle & Data Retention
- [SaaS Subscription Lifecycle Management](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/pc-saas-fulfillment-life-cycle)
- [SaaS Lifecycle Management](https://www.zluri.com/blog/saas-lifecycle-management)
- [California DROP Platform Data Deletion Compliance](https://securityboulevard.com/2026/01/californias-drop-platform-launches-what-enterprise-b2b-saas-companies-need-to-know-about-data-deletion-compliance/)

### B2B SaaS Starter Kit Examples
- [Auth0 B2B SaaS Starter](https://github.com/auth0-developer-hub/auth0-b2b-saas-starter)
- [MakerKit Next.js SaaS Starter](https://makerkit.dev/)
- [SaaSykit Laravel Starter](https://saasykit.com/)
- [Best SaaS Starter Kits 2026](https://graygrids.com/blog/best-saas-starter-kits)

### Platform Admin Examples
- [Clerk Dashboard Overview](https://clerk.com/docs/guides/dashboard/overview)
- [Airtable Admin Panel](https://support.airtable.com/docs/overview-of-the-admin-panel)
- [Retool Admin Panel Templates](https://retool.com/use-case/admin-panel-template)

---

**Research complete.** Findings inform admin console phase structure with emphasis on security (impersonation, audit trails), operator efficiency (search, filters, impersonation), and compliance (audit logs, data retention).
