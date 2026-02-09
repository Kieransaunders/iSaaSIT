# Roadmap: iSaaSIT v1 Completion

**Created:** 2025-02-04
**Phases:** 3
**Requirements:** 9 pending (16 already complete)

## Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 1 | WorkOS Integration ✓ | Real org creation with WorkOS API | ORG-03, ORG-04 |
| 2 | Team Management | Invite users and manage assignments | TEAM-01 to TEAM-06, ASSIGN-02 to ASSIGN-04 |
| 3 | Billing | Lemon Squeezy subscription integration | BILL-01 to BILL-06 |

---

## Phase 1: WorkOS Integration ✓

**Goal:** Replace mock org ID with real WorkOS API calls
**Status:** Complete (2026-02-09)
**Verified:** 12/12 must-haves passed

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md - WorkOS SDK setup + org creation action
- [x] 01-02-PLAN.md - Onboarding flow with billing email
- [x] 01-03-PLAN.md - Settings page with live org data

**Requirements:**
- ORG-03: Org creation calls WorkOS API (not mock ID)
- ORG-04: User can view org settings

**Success Criteria:**
1. User creates org → WorkOS org created with matching name
2. Org ID in Convex matches WorkOS org ID
3. Settings page shows org name from WorkOS
4. Org name can be updated (syncs to WorkOS)

**Dependencies:** None (foundation for Phase 2)

**Notes:**
- WorkOS API requires server-side call (Convex action)
- Need WorkOS API key in environment
- Consider org settings: name, billing email, logo

---

## Phase 2: Team Management

**Goal:** Users can invite staff/clients and manage customer assignments

**Plans:** 5 plans

Plans:
- [ ] 02-01-PLAN.md — Schema + invitation backend (send, revoke, resend)
- [ ] 02-02-PLAN.md — Staff assignment backend + customer detail UI
- [ ] 02-03-PLAN.md — Webhook handler + user management backend
- [ ] 02-04-PLAN.md — Team page UI (tabs, invite dialog, member table)
- [ ] 02-05-PLAN.md — End-to-end verification checkpoint

**Requirements:**
- TEAM-01: Admin can invite staff users
- TEAM-02: Admin can invite client users linked to customer
- TEAM-03: Staff/Client receives email invite
- TEAM-04: Invited user completes signup via WorkOS
- TEAM-05: Admin can view list of org members
- TEAM-06: Admin can remove users from org
- ASSIGN-02: Admin can assign staff to customers
- ASSIGN-03: Admin can unassign staff from customers
- ASSIGN-04: Staff assignment UI in customer detail

**Success Criteria:**
1. Admin invites staff@example.com → email received with invite link
2. Staff clicks link → signs up via WorkOS → lands in org with staff role
3. Admin invites client for "Acme Corp" → client sees only Acme data
4. Team page lists all org members with roles
5. Customer detail page shows assigned staff
6. Admin can add/remove staff assignments

**Dependencies:** Phase 1 (WorkOS API integration)

**Notes:**
- WorkOS has invitation API
- Need Resend setup for invite emails (or use WorkOS email)
- Staff assignment stored in staffCustomerAssignments table (exists)
- Consider bulk assignment UI

---

## Phase 3: Billing

**Goal:** Working Lemon Squeezy subscriptions with usage cap enforcement

**Requirements:**
- BILL-01: Org has subscription status synced from Lemon Squeezy
- BILL-02: Admin can upgrade via Lemon Squeezy checkout
- BILL-03: Webhook handler processes subscription events
- BILL-04: Plan caps update on subscription change
- BILL-05: Usage cap enforced on staff/client creation
- BILL-06: Billing page shows real usage from Convex

**Success Criteria:**
1. Admin clicks "Upgrade" → redirected to Lemon Squeezy checkout
2. After payment → org subscription status = "active"
3. Plan caps (maxCustomers, maxStaff, maxClients) updated from plan
4. Billing page shows real counts vs limits
5. Creating staff/client blocked when at limit with upgrade prompt
6. Subscription cancelled → status updates via webhook

**Dependencies:** Phase 2 (users exist to count against caps)

**Notes:**
- Lemon Squeezy webhook URL: /api/webhooks/lemonsqueezy
- Webhook signature verification required
- Plan caps stored in Lemon Squeezy product metadata
- Test with Lemon Squeezy test mode first

---

## Milestone Completion Criteria

v1 is complete when:
- [ ] All 25 requirements have status "Complete"
- [ ] Org creation uses real WorkOS API
- [ ] Staff and clients can be invited and see appropriate data
- [ ] Billing integrates with Lemon Squeezy
- [ ] Usage caps enforced across all entity types
- [ ] README updated with setup instructions

---
*Roadmap created: 2025-02-04*
