---
phase: 03-billing
plan: 02
subsystem: billing
tags: [lemonsqueezy, convex, subscriptions, checkout, payments]

# Dependency graph
requires:
  - phase: 03-billing-01
    provides: Lemon Squeezy webhook handler and subscription sync
  - phase: 02-team
    provides: User management and role-based access patterns
provides:
  - Billing usage statistics queries (customers, staff, clients against plan limits)
  - Admin-only billing info query with trial status computation
  - Checkout URL creation with pre-filled org data
  - Subscription cancellation via Lemon Squeezy API
  - Customer portal URL retrieval for invoice viewing
affects: [03-billing-03, 03-billing-04, 03-billing-05]

# Tech tracking
tech-stack:
  added: [@lemonsqueezy/lemonsqueezy.js SDK]
  patterns: [Admin-only actions for billing operations, usage counting with pending invitations]

key-files:
  created:
    - convex/billing/queries.ts
    - convex/billing/actions.ts
  modified:
    - package.json (added Lemon Squeezy SDK)
    - .planning/phases/03-billing/03-USER-SETUP.md (added API credentials)

key-decisions:
  - "Include pending invitations in usage counts to prevent race conditions"
  - "Build checkout URLs via string construction instead of SDK (frontend opens via Lemon.js overlay)"
  - "Customer portal URL returns null if no subscription yet (not an error)"

patterns-established:
  - "Admin-only actions for billing operations follow same pattern as invitation actions"
  - "Internal queries reused for user and org lookup (getUserRecord, getMyOrgInternal)"
  - "Trial status computed from subscriptionStatus + trialEndsAt timestamp"

# Metrics
duration: 2.4min
completed: 2026-02-09
---

# Phase 03 Plan 02: Billing Backend Operations Summary

**Convex queries for usage statistics and trial info, plus Lemon Squeezy API actions for checkout, cancellation, and customer portal**

## Performance

- **Duration:** 2.4 minutes
- **Started:** 2026-02-09T15:40:36Z
- **Completed:** 2026-02-09T15:42:59Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Usage statistics query returns real counts from database (customers, staff+pending, clients+pending)
- Billing info query computes trial status and days remaining for billing page
- Checkout URL creation includes org correlation data for webhook processing
- Subscription cancellation calls Lemon Squeezy API and returns end date
- Customer portal URL retrieval for invoice viewing (gracefully handles no subscription)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create billing usage and info queries** - `57ffbcf` (feat)
2. **Task 2: Create checkout and cancel subscription actions** - `21d235f` (feat)

**Plan metadata:** (pending - will be added after STATE.md update)

## Files Created/Modified
- `convex/billing/queries.ts` - Usage stats and billing info queries with authentication and admin role enforcement
- `convex/billing/actions.ts` - Checkout URL creation, subscription cancellation, and customer portal URL actions
- `package.json` / `package-lock.json` - Added @lemonsqueezy/lemonsqueezy.js SDK dependency
- `.planning/phases/03-billing/03-USER-SETUP.md` - Added LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, and LEMONSQUEEZY_STORE_SLUG environment variables

## Decisions Made

**1. Include pending invitations in staff/client usage counts**
- Rationale: Prevents race condition where multiple invitations sent simultaneously could exceed plan limits
- Impact: Matches pattern from plan 02-01 invitation enforcement

**2. Build checkout URLs via string construction**
- Rationale: Frontend uses Lemon.js overlay to open URL (LemonSqueezy.Url.Open()), SDK not needed for URL generation
- Impact: Simpler implementation, pre-fills email/name/org_convex_id for webhook correlation

**3. Return null for customer portal URL when no subscription**
- Rationale: Not an error condition - user simply hasn't subscribed yet
- Impact: UI can gracefully handle null (hide invoice link until subscription exists)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward implementation leveraging existing patterns from WorkOS integration and team management.

## User Setup Required

**External services require manual configuration.** See [03-USER-SETUP.md](./03-USER-SETUP.md) for:
- Environment variables to add (LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_STORE_SLUG)
- Dashboard configuration steps for API key creation
- Store credentials lookup instructions

The USER-SETUP.md file has been updated with the additional environment variables required for server-side Lemon Squeezy API operations.

## Next Phase Readiness

**Ready for Plan 03-03:** Billing page UI can now:
- Display usage statistics with real counts
- Show trial status and days remaining
- Create checkout URLs for plan upgrades
- Cancel subscriptions via admin action
- Link to customer portal for invoice viewing

**Blockers:** None - backend billing operations complete

**Concerns:**
- Lemon Squeezy API keys and store credentials must be configured before frontend can call these actions
- Variant IDs in lemonsqueezy/plans.ts must be updated with actual values from Lemon Squeezy dashboard (per plan 03-01)

---
*Phase: 03-billing*
*Completed: 2026-02-09*
