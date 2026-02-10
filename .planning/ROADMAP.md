# Roadmap: iSaaSIT v1 Completion

**Created:** 2025-02-04  
**Last Updated:** 2026-02-10  
**Current Focus:** Phase 3 In Progress — Billing + v1 ship blockers  
**Overall Progress:** 26/32 requirements complete (81%)

## Overview

| Phase | Name | Goal | Status | Progress |
|-------|------|------|--------|----------|
| 1 | WorkOS Integration ✓ | Real org creation with WorkOS API | ✓ Complete | 100% |
| 2 | Team Management | Invite users and manage assignments | In Progress | 80% |
| 3 | Billing | Lemon Squeezy subscription integration | In Progress | 40% |

---

## Phase 1: WorkOS Integration ✓

**Goal:** Replace mock org ID with real WorkOS API calls  
**Status:** ✓ Complete (2026-02-09)  
**Verified:** 12/12 must-haves passed  

**Plans:** 3 plans (3 complete)
- [x] 01-01-PLAN.md - WorkOS SDK setup + org creation action
- [x] 01-02-PLAN.md - Onboarding flow with billing email
- [x] 01-03-PLAN.md - Settings page with live org data

**Requirements:**
- ORG-03: Org creation calls WorkOS API (not mock ID)
- ORG-04: User can view org settings

---

## Phase 2: Team Management ✓

**Goal:** Users can invite staff/clients and manage customer assignments  
**Status:** ✓ Complete (2026-02-10) — 5 of 5 plans complete (100%)

**Plans:** 5 plans
- [x] 02-01-PLAN.md — Schema + invitation backend (send, revoke, resend)
- [x] 02-02-PLAN.md — Staff assignment backend + customer detail UI
- [x] 02-03-PLAN.md — Webhook handler + user management backend
- [x] 02-04-PLAN.md — Team page UI (tabs, invite dialog, member table)
- [x] 02-05-PLAN.md — End-to-end verification checkpoint + bug fixes

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

---

## Phase 3: Billing (In Progress)

**Goal:** Working Lemon Squeezy subscriptions with usage cap enforcement  
**Status:** 3 of 6 plans complete (50%)

**Plans:** 6 plans
- [x] 03-01-PLAN.md — Webhook handler + signature verification + subscription sync
- [x] 03-02-PLAN.md — Checkout action + cancel action + billing usage queries
- [ ] 03-03-PLAN.md — Billing page UI with real data + checkout overlay
- [ ] 03-04-PLAN.md — Cap enforcement UX + warning banners + inline upgrade prompts
- [ ] 03-05-PLAN.md — End-to-end verification checkpoint
- [x] 03-06-PLAN.md — Gap closure: InviteDialog CapReachedBanner upgrade prompt

**Requirements:**
- BILL-01: Org has subscription status synced from Lemon Squeezy
- BILL-02: Admin can upgrade via Lemon Squeezy checkout
- BILL-03: Webhook handler processes subscription events
- BILL-04: Plan caps update on subscription change
- BILL-05: Usage cap enforced on staff/client creation
- BILL-06: Billing page shows real usage from Convex

**Blocker:** Real Lemon Squeezy checkout + webhook verification pending (test mode)

---

## Recent Activity

- **2026-02-10:** Phase 2 signed off — Bug fixes applied (index optimization, orphaned invitation cleanup, usage cap checks on resend)
- **2026-02-09:** Plan 03-02 complete — Billing backend operations (usage queries, checkout URL, subscription cancellation)
- **2026-02-09:** Plan 03-01 complete — Lemon Squeezy webhook handler and subscription sync
- **2026-02-09:** Plan 02-04 complete — Team management UI with tabbed interface, invite dialog, member/invitation tables
- **2026-02-09:** Plan 02-03 complete — WorkOS webhook handler (invitation.accepted) + user management backend (remove/restore/list)
- **2026-02-09:** Plan 02-02 complete — Staff assignment mutations/queries + customer detail assignment UI

---

## Ship Blockers (as of 2026-02-10)

- [x] Fix Lemon Squeezy plan mapping to use real variant IDs (`convex/lemonsqueezy/plans.ts`)
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

---
*Roadmap created: 2025-02-04*
*Last updated: 2026-02-10*
