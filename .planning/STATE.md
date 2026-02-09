# Project State: iSaaSIT

**Last updated:** 2026-02-09

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-04)

**Core value:** Agencies can spin up client projects with data isolation, billing, and role-based access
**Current focus:** Phase 2 In Progress — Team Management UI Complete

## Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| 1 | ✓ Complete | 100% |
| 2 | In Progress | 4/5 plans |
| 3 | In Progress | 2/5 plans |

**Overall:** 20/25 requirements complete (80%)

## Phase Status

### Phase 1: WorkOS Integration ✓
- **Status:** Complete (2026-02-09)
- **Requirements:** ORG-03 ✓, ORG-04 ✓
- **Verification:** 12/12 must-haves passed
- **Plans:** 01-01 ✓, 01-02 ✓, 01-03 ✓

### Phase 2: Team Management
- **Status:** In progress (4 of 5 plans complete)
- **Requirements:** TEAM-01 ✓, TEAM-02 ✓, TEAM-03 ✓, TEAM-04 ✓, TEAM-05, TEAM-06, ASSIGN-02 ✓, ASSIGN-03 ✓, ASSIGN-04 ✓
- **Plans:** 02-01 ✓ (schema + invitation backend), 02-02 ✓ (staff assignment), 02-03 ✓ (webhook + user management), 02-04 ✓ (team UI)
- **Blockers:** None

### Phase 3: Billing
- **Status:** In progress (2 of 5 plans complete)
- **Requirements:** BILL-01 to BILL-06
- **Plans:** 03-01 ✓ (webhook + sync), 03-02 ✓ (billing backend)
- **Blockers:** None

## Recent Activity

- 2026-02-09: Plan 03-02 complete — Billing backend operations (usage queries, checkout URL, subscription cancellation)
- 2026-02-09: Plan 03-01 complete — Lemon Squeezy webhook handler and subscription sync
- 2026-02-09: Plan 02-04 complete — Team management UI with tabbed interface, invite dialog, member/invitation tables
- 2026-02-09: Plan 02-03 complete — WorkOS webhook handler (invitation.accepted) + user management backend (remove/restore/list)
- 2026-02-09: Plan 02-02 complete — Staff assignment mutations/queries + customer detail assignment UI

## Accumulated Context

### Decisions

| Decision | Phase | Rationale | Impact |
|----------|-------|-----------|--------|
| Include pending invitations in usage counts | 03-02 | Prevents race condition exceeding plan limits | Usage queries count active + pending for staff/clients |
| Build checkout URLs via string construction | 03-02 | Frontend uses Lemon.js overlay, SDK not needed | Simpler implementation, pre-fills org data for webhook |
| Return null for customer portal URL when no subscription | 03-02 | Not an error - user hasn't subscribed yet | UI can gracefully handle null (hide invoice link) |
| Web Crypto API for Lemon Squeezy signature verification | 03-01 | Convex HTTP actions cannot use Node.js crypto module | Pattern for all webhook signature verification in Convex |
| Placeholder variant IDs in plan config | 03-01 | User must create products in Lemon Squeezy dashboard first | Requires manual setup step documented in USER-SETUP.md |
| Cancelled subscriptions keep limits until endsAt | 03-01 | Lemon Squeezy grace period allows access until period ends | UI must show 'Active until [date]' for cancelled subscriptions |
| Store trialEndsAt and endsAt timestamps on org | 03-01 | UI needs to display trial countdown and grace period | Schema extended with optional timestamp fields |
| Client-side tab filtering for team page | 02-04 | Single query, instant tab switching, better UX | May need pagination for orgs with 1000+ users |
| Separate TeamTable and PendingTable components | 02-04 | Different data shapes require distinct components | Pattern for specialized table components |
| Console.error for async errors (not toasts yet) | 02-04 | Toast system not implemented | Replace with toast notifications in future |
| Confirmation dialog only for user removal | 02-04 | User removal more permanent than revoking invitation | AlertDialog before removeUser, not for revoke |
| Manual HMAC webhook verification | 02-03 | Convex HTTP actions can't use "use node" | Web Crypto API for signature verification, pattern for all webhooks |
| Auto-unassign staff on removal | 02-03 | Prevent orphaned assignments | Staff assignments deleted when user removed, not restored on restore |
| Computed status field in user queries | 02-03 | Frontend needs active/removed distinction | listOrgMembers returns status based on deletedAt field |
| Self-removal prevention | 02-03 | Prevent admin lockout | removeUser throws error if targeting self |
| Admin-only assignment UI | 02-02 | Only admins should manage staff assignments per security model | Assignment card hidden from staff and client roles |
| Inline assignment UI on customer detail | 02-02 | Assignments are customer-scoped, most intuitive on customer page | No separate assignment management page needed |
| Prevent duplicate assignments at mutation level | 02-02 | Ensures data integrity, simpler than frontend checks | ConvexError thrown if duplicate assignment attempted |
| Separate internal.ts for queries/mutations in Convex | 02-01 | "use node" files can only contain actions | Pattern for all future WorkOS API integrations |
| Usage caps include pending invitations | 02-01 | Prevent race condition exceeding plan limits | All invitation enforcement checks active + pending counts |
| Client invitations require customerId | 02-01 | Data isolation requires customer assignment | Enforced in sendInvitation action |
| Resend = revoke + send (no native resend) | 02-01 | WorkOS SDK pattern | Standard for invitation lifecycle management |

### Pending Todos
1. Replace agency copy with generic workspace terminology (area: ui)
2. Configure WorkOS webhook endpoint for invitation.accepted events (area: workos-setup) - REQUIRED for invitation acceptance to work end-to-end
3. Configure Lemon Squeezy webhook endpoint and environment variables (area: billing-setup) - REQUIRED for billing operations
4. Update variant IDs in convex/lemonsqueezy/plans.ts with actual Lemon Squeezy variant IDs (area: billing-config)

## Next Action

Continue Phase 3: Billing — Plan 03-03 (billing page UI implementation)

---
*State tracking initialized: 2025-02-04*
