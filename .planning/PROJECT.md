# iSaaSIT

## What This Is

The open-source SaaS starter kit for agencies and service businesses managing client companies. Provides a repeatable foundation for building client portals with data isolation, team assignments, and role-based access. Built on WorkOS AuthKit + Convex + TanStack Start.

**Architecture:** Your agency (Org) manages multiple client companies (Customers) with proper data isolation, billing with usage caps, and team member assignments.

## Core Value

Agencies can launch client portals with proper data isolation, billing enforcement, and role-based access without rebuilding auth/tenancy/billing infrastructure each time. Fork, customize for your domain, and ship.

## Requirements

### Validated

- User can sign in via WorkOS AuthKit — existing
- Authenticated routes protected via TanStack Start loader — existing
- Convex backend connected with WorkOS JWT validation — existing

### Active

- [ ] User can create an Organization after signup
- [ ] Org syncs to WorkOS and stores subscription data in Convex
- [ ] Admin can create Customer records within their Org
- [ ] Admin can invite Staff users to the Org
- [ ] Admin can assign Staff to specific Customers
- [ ] Admin or Staff can invite Client users linked to a Customer
- [ ] Staff can only query data for their assigned Customers
- [ ] Client can only query data for their own Customer
- [ ] Admin can upgrade Org via Lemon Squeezy checkout
- [ ] Subscription webhooks update Org caps (maxCustomers, maxStaff, maxClients)
- [ ] System enforces usage caps before creating Customers/Staff/Clients
- [ ] UI uses shadcn/ui component library

### Out of Scope

- AI integrations — can be added as extension later
- Mobile app (React Native) — web-first for v1
- Custom role definitions — hardcoded Admin/Staff/Client only
- Per-Customer billing — Org-level billing only
- Multiple Orgs per user — single Org membership in v1
- OAuth providers beyond WorkOS — WorkOS handles auth providers

## Context

**Base template:** Fork of `get-convex/workos-authkit` (TanStack Start + Convex + WorkOS)

**Original plan evolution:** Started from convex-saas scope doc, pivoted to workos-authkit base. Original plan had Better Auth and Stripe — now using WorkOS AuthKit and Lemon Squeezy.

**Existing codebase includes:**
- TanStack Start with SSR
- WorkOS AuthKit integration (`@workos/authkit-tanstack-react-start`)
- Convex backend with JWT auth config
- Basic route protection (`_authenticated` layout)
- Tailwind 4 setup

**Data model:**
- **Org**: WorkOS manages org + membership; Convex stores subscriptionId, status, planId, caps
- **Customer**: Agency's client company (Convex table, linked to orgId)
- **User**: WorkOS manages; linked to customerId if role = Client
- **StaffCustomerAssignment**: Maps Staff users to Customers they can access

**Role definitions (in WorkOS):**
| Role | Sees | Can Do |
|------|------|--------|
| Admin | All org data | Billing, invites, full access |
| Staff | Assigned Customers only | Standard access within scope |
| Client | Own Customer only | Limited access within scope |

**Billing model:**
- Freemium: Limited free tier, paid plans unlock more
- Billing level: Org (not individual users)
- Provider: Lemon Squeezy
- Caps synced from plan metadata: maxCustomers, maxStaff, maxClients

## Constraints

- **Tech stack**: Must use existing WorkOS + Convex + TanStack Start foundation
- **Auth provider**: WorkOS AuthKit (not negotiable — already integrated)
- **Billing provider**: Lemon Squeezy (Merchant of Record for global sales)
- **Deployment**: Netlify (primary target)
- **License**: MIT (matching upstream)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| WorkOS over Better Auth | Already integrated in base template, has built-in orgs/roles | — Pending |
| Lemon Squeezy over Stripe | Merchant of Record simplifies global tax/compliance | — Pending |
| TanStack Start over plain Vite | SSR support, better SEO, faster initial load | — Pending |
| Roles in WorkOS not Convex | Single source of truth, WorkOS handles membership | — Pending |
| shadcn/ui for components | Accessible, customizable, works with Tailwind | — Pending |

## Milestones

### v1.0: SaaS Starter Kit Foundation (Active)
Multi-tenant foundation with auth, org management, team invites, billing. Phases 1-3.

### v2.0: Admin Console (Planned)
**Goal:** Platform-level admin dashboard — separate `/admin` route as an "app within the app" with its own sidebar and views. Enables the SaaS operator to manage all orgs, impersonate users, view platform metrics, and configure system settings.

**Target features:**
- Platform super admin role (above org-level admin)
- All Orgs view with impersonation
- Platform metrics dashboard (orgs, users, revenue, growth)
- Cross-org user management (suspend, reset, unsuspend)
- System settings (config, feature flags, billing plans, webhook logs)

## Repository

**GitHub:** https://github.com/Kieransaunders/iSaaSIT.git

**License:** MIT

---
*Last updated: 2026-02-06 after v2.0 milestone definition*
