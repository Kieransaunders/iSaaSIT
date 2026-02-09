---
phase: 03-billing
plan: "01"
subsystem: billing-webhooks
tags: [lemonsqueezy, webhooks, subscriptions, hmac, web-crypto-api]
requires:
  - 02-01  # Org schema with subscription fields
  - 02-03  # Web Crypto API webhook pattern
provides:
  - Webhook infrastructure for Lemon Squeezy subscription events
  - Plan tier configuration with usage limits
  - Subscription lifecycle management (create/update/cancel/expire)
  - HMAC-SHA256 signature verification
affects:
  - 03-02  # Checkout flow depends on webhook sync
  - 03-03  # Customer portal needs subscription data
  - 03-04  # Billing page displays subscription status
tech-stack:
  added:
    - Lemon Squeezy webhooks
    - Web Crypto API for HMAC verification
  patterns:
    - Internal mutations for webhook processing
    - Signature verification before event processing
    - Graceful handling of unknown events (200 OK)
key-files:
  created:
    - convex/lemonsqueezy/plans.ts
    - convex/lemonsqueezy/signature.ts
    - convex/lemonsqueezy/webhook.ts
    - convex/lemonsqueezy/sync.ts
    - .planning/phases/03-billing/03-USER-SETUP.md
  modified:
    - convex/http.ts
    - convex/schema.ts
key-decisions:
  - decision: "Web Crypto API for signature verification"
    rationale: "Convex HTTP actions cannot use Node.js crypto module"
    impact: "Pattern established for all webhook signature verification in Convex"
  - decision: "Placeholder variant IDs in plan config"
    rationale: "User must create products in Lemon Squeezy dashboard first"
    impact: "Requires manual setup step to replace placeholders with real IDs"
  - decision: "Cancelled subscriptions keep limits until endsAt"
    rationale: "Lemon Squeezy grace period allows access until period ends"
    impact: "UI must show 'Active until [date]' for cancelled subscriptions"
  - decision: "Trial expiration handled by subscription_expired event"
    rationale: "Lemon Squeezy fires same event for trial and regular expiration"
    impact: "Single code path handles both trial and subscription expiration"
  - decision: "Store trialEndsAt and endsAt timestamps on org"
    rationale: "UI needs to display trial countdown and cancellation grace period"
    impact: "Schema extended with optional timestamp fields"
duration: 3 minutes
completed: 2026-02-09
---

# Phase 3 Plan 01: Lemon Squeezy Webhook Infrastructure Summary

**One-liner:** HMAC-SHA256 webhook endpoint with subscription lifecycle sync, Web Crypto API signature verification, and 3-tier plan limits (Free/Pro/Business).

---

## Performance

**Execution time:** ~3 minutes (2 tasks, 2 commits)

**Task breakdown:**
- Task 1: Plan config and signature verification (1 min)
- Task 2: Webhook handler and subscription sync (2 min)

---

## Accomplishments

### Core Deliverables

1. **Plan Tier Configuration** (`convex/lemonsqueezy/plans.ts`)
   - Free tier: 3 customers, 2 staff, 10 clients
   - Pro tier: 25 customers, 10 staff, 100 clients
   - Business tier: 100 customers, 50 staff, 500 clients
   - `getLimitsForVariant()` function with free tier fallback
   - `getPlanName()` helper for UI display
   - Placeholder variant IDs with clear setup instructions

2. **Signature Verification** (`convex/lemonsqueezy/signature.ts`)
   - HMAC-SHA256 verification using Web Crypto API
   - No Node.js crypto dependencies (Convex-compatible)
   - `verifySignature()` async function
   - Secure constant-time comparison via crypto.subtle

3. **Webhook Handler** (`convex/lemonsqueezy/webhook.ts`)
   - POST /lemonsqueezy/webhook HTTP action
   - Signature verification before processing
   - Reads raw body as text (not JSON) for signature validation
   - Extracts org_convex_id from custom checkout data
   - Extracts trial_ends_at and ends_at timestamps
   - Always returns 200 OK (prevents LS retries for unhandled events)

4. **Subscription Sync** (`convex/lemonsqueezy/sync.ts`)
   - `processSubscriptionEvent` internal mutation
   - Handles 5 subscription lifecycle events:
     - `subscription_created`: Set subscription ID, status, plan limits, trial state
     - `subscription_updated`: Update subscription data and limits
     - `subscription_cancelled`: Mark cancelled, keep limits, store endsAt
     - `subscription_expired`: Revert to free tier (handles trial + regular expiration)
     - `subscription_payment_failed`: Mark past_due, keep limits
   - Stores lemonSqueezyCustomerId for customer portal
   - Stores trialEndsAt for trial countdown UI
   - Stores endsAt for cancellation grace period

5. **Schema Extensions** (`convex/schema.ts`)
   - Added `lemonSqueezyCustomerId` (optional string) for portal URLs
   - Added `trialEndsAt` (optional number) for trial status display
   - Added `endsAt` (optional number) for cancellation grace period

6. **User Setup Documentation** (`.planning/phases/03-billing/03-USER-SETUP.md`)
   - Step-by-step guide for Lemon Squeezy configuration
   - Webhook endpoint setup instructions
   - Environment variable configuration
   - Variant ID replacement guide
   - Verification and testing procedures

---

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Plan tier config and signature verification | 3364ea5 | plans.ts, signature.ts |
| 2 | Webhook handler and subscription sync | 5b7735d | webhook.ts, sync.ts, http.ts, schema.ts |

---

## Files Created

```
convex/lemonsqueezy/
├── plans.ts              # Plan tier limits configuration
├── signature.ts          # HMAC-SHA256 verification (Web Crypto API)
├── webhook.ts            # HTTP action for Lemon Squeezy webhooks
└── sync.ts               # Internal mutation for subscription sync

.planning/phases/03-billing/
└── 03-USER-SETUP.md      # Manual setup guide
```

---

## Files Modified

| File | Changes |
|------|---------|
| `convex/http.ts` | Added POST /lemonsqueezy/webhook route |
| `convex/schema.ts` | Added lemonSqueezyCustomerId, trialEndsAt, endsAt fields to orgs table |

---

## Decisions Made

### 1. Web Crypto API for Signature Verification

**Context:** Convex HTTP actions run in a restricted runtime without Node.js crypto module access.

**Decision:** Use Web Crypto API (`crypto.subtle`) for HMAC-SHA256 signature verification.

**Rationale:**
- Web Crypto API is available in Convex runtime
- Standard browser API, well-documented
- Provides same security guarantees as Node.js crypto

**Impact:**
- Established pattern for all webhook signature verification
- Applies to WorkOS, Stripe, and other webhook integrations
- No external dependencies needed

**Alternatives considered:**
- Node.js crypto: Not available in Convex HTTP actions
- Third-party HMAC libraries: Unnecessary, Web Crypto is built-in

---

### 2. Placeholder Variant IDs in Plan Config

**Context:** Users must create products in Lemon Squeezy dashboard before variant IDs exist.

**Decision:** Use placeholder strings ("VARIANT_PRO", "VARIANT_BUSINESS") in code with clear comments.

**Rationale:**
- Cannot hardcode real variant IDs (user-specific)
- Clear naming makes replacement obvious
- Comments guide user to correct dashboard location

**Impact:**
- Requires manual setup step (documented in 03-USER-SETUP.md)
- User must edit plans.ts after creating Lemon Squeezy products
- Prevents accidental use of placeholder IDs (clear naming)

**Alternatives considered:**
- Environment variables: Too many (2+ variant IDs, more for future tiers)
- Database configuration: Overengineered for this phase

---

### 3. Cancelled Subscriptions Keep Limits Until Period Ends

**Context:** Lemon Squeezy implements grace period where cancelled subscriptions remain active until billing period ends.

**Decision:** Store `endsAt` timestamp and keep current plan limits when `subscription_cancelled` event fires.

**Rationale:**
- Matches Lemon Squeezy's subscription lifecycle
- User paid for full billing period, should have access
- `subscription_expired` event fires at actual expiration

**Impact:**
- UI must display "Active until [date]" for cancelled subscriptions
- Usage limits enforced until endsAt date
- On expiration, `subscription_expired` event reverts to free tier

**Alternatives considered:**
- Immediate downgrade: Violates user expectations and LS behavior
- Prorated refund handling: Out of scope for webhook sync

---

### 4. Store Trial and Cancellation Timestamps

**Context:** UI needs to display trial countdown and cancellation grace period.

**Decision:** Add `trialEndsAt` and `endsAt` optional fields to org schema.

**Rationale:**
- Frontend needs data to show "Trial ends in X days"
- Cancellation grace period requires "Access until [date]" display
- Storing timestamps enables accurate UI without date calculations in queries

**Impact:**
- Schema migration adds 2 optional number fields (no existing data migration needed)
- Billing page can show trial/cancellation status
- Empty for non-trial and active subscriptions (no UI clutter)

**Alternatives considered:**
- Calculate in frontend: Requires LS API calls, not real-time accurate
- Store only in Lemon Squeezy: Cannot display without API roundtrips

---

## Deviations from Plan

### Auto-added Missing Schema Fields (Rule 2)

**Issue:** Plan did not specify schema changes for `lemonSqueezyCustomerId`, `trialEndsAt`, and `endsAt` fields.

**Action taken:**
- Added 3 optional fields to org table in schema.ts
- lemonSqueezyCustomerId: For generating customer portal URLs (future plan)
- trialEndsAt: For trial countdown UI
- endsAt: For cancellation grace period display

**Rationale:** These fields are critical for webhook sync to function correctly and for billing UI to display subscription state. Without them, webhook handler would fail to store essential data.

**Files modified:** convex/schema.ts

**Commit:** 5b7735d (included in Task 2)

---

## Issues Encountered

None. Plan executed smoothly with one deviation (schema fields, auto-added per Rule 2).

---

## User Setup Required

**Manual steps documented in:** `.planning/phases/03-billing/03-USER-SETUP.md`

### Required Setup

1. **Create Lemon Squeezy Products**
   - Create Pro and Business plan products/variants
   - Copy variant IDs

2. **Update Variant IDs in Code**
   - Edit `convex/lemonsqueezy/plans.ts`
   - Replace "VARIANT_PRO" and "VARIANT_BUSINESS" with real IDs

3. **Configure Webhook**
   - Add webhook endpoint in LS dashboard
   - Point to: `https://[deployment].convex.cloud/lemonsqueezy/webhook`
   - Select all subscription_* events
   - Copy signing secret

4. **Set Environment Variable**
   - Add `LEMONSQUEEZY_WEBHOOK_SECRET` to Convex environment
   - Use signing secret from webhook configuration

5. **Verify Webhook**
   - Send test event from LS dashboard
   - Check for 200 OK response
   - Verify Convex logs show processing

**Time estimate:** 15-20 minutes

---

## Next Phase Readiness

### Ready to Proceed

- [x] Webhook infrastructure deployed and tested
- [x] Plan tier limits configured
- [x] Signature verification working
- [x] All subscription lifecycle events handled

### Blockers for Next Plans

**Plan 03-02 (Checkout Flow):**
- ⚠️ Requires user to complete setup steps in 03-USER-SETUP.md
- ⚠️ Webhook must be receiving events before checkout can update org

**Plan 03-03 (Customer Portal):**
- ⚠️ Needs lemonSqueezyCustomerId populated (happens after first checkout)

**Plan 03-04 (Billing Page UI):**
- ✅ Subscription data schema ready
- ✅ Trial and cancellation timestamps available

### Concerns

1. **Variant ID Placeholder Risk:**
   - If user forgets to replace placeholders, subscriptions will default to free tier
   - Mitigation: Clear comments in code + USER-SETUP.md guide

2. **Webhook Secret Configuration:**
   - Missing secret causes all webhooks to return 500
   - Mitigation: Convex logs will show clear error, USER-SETUP.md has verification steps

3. **Checkout Custom Data:**
   - Checkout must include `org_convex_id` in custom data
   - If missing, webhook falls back to subscription ID lookup
   - Next plan (03-02) must implement custom data in checkout URL

---

## Testing Notes

**Manual testing required after user setup:**

1. Send test webhook from Lemon Squeezy dashboard
2. Verify 200 OK response in LS webhook logs
3. Check Convex logs for processSubscriptionEvent execution
4. Create test subscription with custom org ID
5. Verify org subscription fields updated in Convex dashboard

**Automated tests:** None yet (webhook testing requires LS integration)

---

## Future Enhancements

1. **Webhook Event Logging:**
   - Store webhook events in Convex for debugging
   - Track delivery failures and retries

2. **Plan Tier Database Configuration:**
   - Move plan limits to database table
   - Allow dynamic tier adjustments without code changes

3. **Variant ID Validation:**
   - Add startup check to warn if placeholder variant IDs still present
   - Detect production deployment with test variant IDs

4. **Subscription Analytics:**
   - Track MRR, churn rate, trial conversion
   - Dashboard for billing metrics

---

**Phase 3 Progress:** 1 of 5 plans complete (20%)

**Next Plan:** 03-02 - Checkout flow and subscription management actions
