# Requirements: iSaaSIT

**Defined:** 2025-02-04
**Core Value:** Agencies can spin up client projects with data isolation, billing, and role-based access out of the box

## v1 Requirements

### Authentication (Complete)

- [x] **AUTH-01**: User can sign in via WorkOS AuthKit
- [x] **AUTH-02**: Authenticated routes protected via loader
- [x] **AUTH-03**: Session persists across page refresh

### Organization (Complete)

- [x] **ORG-01**: User redirected to onboarding if no org
- [x] **ORG-02**: User can create org via onboarding form
- [x] **ORG-03**: Org creation calls WorkOS API (not mock ID)
- [x] **ORG-04**: User can view org settings

### Customer Management (Complete)

- [x] **CUST-01**: Admin can create customers
- [x] **CUST-02**: Admin can edit customers
- [x] **CUST-03**: Admin can delete customers
- [x] **CUST-04**: Customers list filtered by search
- [x] **CUST-05**: Usage cap enforced on customer creation

### Data Scoping (Complete)

- [x] **SCOPE-01**: Admin sees all org customers
- [x] **SCOPE-02**: Staff sees only assigned customers
- [x] **SCOPE-03**: Client sees only their customer
- [x] **SCOPE-04**: Access denied if user tries to access other customer

### Team Management (Complete)

- [x] **TEAM-01**: Admin can invite staff users
- [x] **TEAM-02**: Admin can invite client users linked to customer
- [x] **TEAM-03**: Staff/Client receives email invite
- [x] **TEAM-04**: Invited user completes signup via WorkOS
- [x] **TEAM-05**: Admin can view list of org members
- [x] **TEAM-06**: Admin can remove users from org

Note: TEAM-04 requires the WorkOS `invitation.accepted` webhook to be configured to attach users to orgs in Convex.

### Staff Assignment (Complete)

- [x] **ASSIGN-01**: Staff auto-assigned to customers they create
- [x] **ASSIGN-02**: Admin can assign staff to customers
- [x] **ASSIGN-03**: Admin can unassign staff from customers
- [x] **ASSIGN-04**: Staff assignment UI in customer detail

### Billing (In Progress — needs config & verification)

- [ ] **BILL-01**: Org has subscription status synced from Lemon Squeezy
- [ ] **BILL-02**: Admin can upgrade via Lemon Squeezy checkout
- [ ] **BILL-03**: Webhook handler processes subscription events
- [ ] **BILL-04**: Plan caps update on subscription change
- [ ] **BILL-05**: Usage cap enforced on staff/client creation
- [ ] **BILL-06**: Billing page shows real usage from Convex

Note: Billing backend/UI exist but require Lemon Squeezy webhook config and variant ID plan mapping to verify end-to-end.

### Release Readiness (v1 Ship Blockers)

- [x] Fix Lemon Squeezy plan mapping to use real variant IDs in `convex/lemonsqueezy/plans.ts`
- [ ] Enforce admin role on org settings updates (`convex/workos/updateOrg.ts`)
- [ ] Add role-based access checks to staff assignment queries (prevent staff/client from listing arbitrary assignments)
- [ ] Handle customer deletion with client users/invites (block or cascade cleanup)
- [x] Enforce org onboarding redirect in `src/routes/_authenticated.tsx`
- [ ] Clarify restore-user behavior (reinvite vs restore), adjust UI accordingly
- [ ] Configure WorkOS webhook endpoint and `WORKOS_WEBHOOK_SECRET`
- [ ] Configure Lemon Squeezy webhook endpoint and environment variables
- [ ] Verify Lemon Squeezy checkout + webhook end-to-end (test mode)
- [x] Add CapReachedBanner to invite flow
- [x] Update docs to reflect billing is implemented and required Convex env vars
- [ ] Run v1 smoke test checklist and update requirement statuses

## v2 Requirements

### Notifications
- **NOTIF-01**: Email on new team invite
- **NOTIF-02**: Email on approaching usage limit
- **NOTIF-03**: In-app notification center

### Enhanced Billing
- **BILL-07**: Admin can cancel subscription
- **BILL-08**: Admin can change plans
- **BILL-09**: Usage history/analytics

### Client Portal
- **PORTAL-01**: Client-specific dashboard
- **PORTAL-02**: Client can update own profile
- **PORTAL-03**: Limited navigation for clients

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom roles | Hardcoded Admin/Staff/Client sufficient for v1 |
| Multiple orgs per user | Simplifies data model, revisit in v2 |
| Per-customer billing | Org-level billing only |
| Audit logs | Nice-to-have, defer to v2 |
| File uploads | Storage costs, add as extension |
| AI features | Not core value |
| Mobile app | Web responsive is sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | - | Complete |
| AUTH-02 | - | Complete |
| AUTH-03 | - | Complete |
| ORG-01 | - | Complete |
| ORG-02 | - | Complete |
| ORG-03 | 1 | Complete |
| ORG-04 | 1 | Complete |
| CUST-01 | - | Complete |
| CUST-02 | - | Complete |
| CUST-03 | - | Complete |
| CUST-04 | - | Complete |
| CUST-05 | - | Complete |
| SCOPE-01 | - | Complete |
| SCOPE-02 | - | Complete |
| SCOPE-03 | - | Complete |
| SCOPE-04 | - | Complete |
| TEAM-01 | 2 | Complete |
| TEAM-02 | 2 | Complete |
| TEAM-03 | 2 | Complete |
| TEAM-04 | 2 | Complete |
| TEAM-05 | 2 | Complete |
| TEAM-06 | 2 | Complete |
| ASSIGN-01 | - | Complete |
| ASSIGN-02 | 2 | Complete |
| ASSIGN-03 | 2 | Complete |
| ASSIGN-04 | 2 | Complete |
| BILL-01 | 3 | Pending |
| BILL-02 | 3 | Pending |
| BILL-03 | 3 | Pending |
| BILL-04 | 3 | Pending |
| BILL-05 | 3 | Pending |
| BILL-06 | 3 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Complete: 26 (81%)
- Pending: 6 (19%)

---
*Requirements defined: 2025-02-04*
*Last updated: 2026-02-10 after ship-readiness review*
