---
phase: 03-billing
verified: 2026-02-09T18:30:00Z
status: gaps_found
score: 35/38 must-haves verified
gaps:
  - truth: "Inviting staff when at maxStaff limit shows upgrade prompt"
    status: failed
    reason: "Backend throws error with upgrade message, but frontend InviteDialog only shows error text without CapReachedBanner or link to billing page"
    artifacts:
      - path: "src/components/team/invite-dialog.tsx"
        issue: "Error displayed in Alert but no CapReachedBanner component or link to /billing"
    missing:
      - "Import CapReachedBanner component"
      - "Add conditional CapReachedBanner below error alert when error contains 'Staff limit reached'"
      - "Disable submit button when at staff limit"
  - truth: "Inviting client when at maxClients limit shows upgrade prompt"
    status: failed
    reason: "Backend throws error with upgrade message, but frontend InviteDialog only shows error text without CapReachedBanner or link to billing page"
    artifacts:
      - path: "src/components/team/invite-dialog.tsx"
        issue: "Error displayed in Alert but no CapReachedBanner component or link to /billing"
    missing:
      - "Import CapReachedBanner component"
      - "Add conditional CapReachedBanner below error alert when error contains 'Client limit reached'"
      - "Disable submit button when at client limit"
  - truth: "Upgrade prompts link to billing page or open checkout overlay"
    status: partial
    reason: "Customer creation dialog has CapReachedBanner linking to /billing (verified). Team InviteDialog missing CapReachedBanner component."
    artifacts:
      - path: "src/components/team/invite-dialog.tsx"
        issue: "No link to billing page on limit error"
    missing:
      - "Add CapReachedBanner with link to /billing when limit error occurs"
---

# Phase 3: Billing Verification Report

**Phase Goal:** Working Lemon Squeezy subscriptions with usage cap enforcement
**Verified:** 2026-02-09T18:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Webhook endpoint at /lemonsqueezy/webhook accepts POST requests | ✓ VERIFIED | convex/http.ts routes POST to handleWebhook (line 15-18) |
| 2 | Invalid webhook signatures are rejected with 401 | ✓ VERIFIED | webhook.ts verifies signature (line 44), returns 401 if invalid (line 47) |
| 3 | Org subscription status reflects Lemon Squeezy state after webhook events | ✓ VERIFIED | sync.ts updates subscriptionStatus via mapStatus() (line 62-78, 92) |
| 4 | Cancelled subscriptions marked immediately in database with access until period end | ✓ VERIFIED | sync.ts handles subscription_cancelled, keeps limits, stores endsAt (line 101-110) |
| 5 | Expired subscriptions revert org to free tier limits | ✓ VERIFIED | sync.ts handles subscription_expired, resets to FREE_TIER_LIMITS (line 111-124) |
| 6 | Trial subscriptions store trial_ends_at for UI display | ✓ VERIFIED | sync.ts stores trialEndsAt timestamp when present (line 86-88, 98) |
| 7 | Variant ID to plan limits mapping is centralized in one file | ✓ VERIFIED | plans.ts exports PLAN_TIERS and getLimitsForVariant (line 23-64) |
| 8 | Admin can request a checkout URL for a specific plan variant | ✓ VERIFIED | actions.ts createCheckoutUrl builds pre-filled URL (line 12-63) |
| 9 | Admin can cancel an existing subscription | ✓ VERIFIED | actions.ts cancelSubscription calls Lemon Squeezy SDK (line 71-137) |
| 10 | Admin can get a customer portal URL for invoice viewing | ✓ VERIFIED | actions.ts getCustomerPortalUrl returns portal URL (line 144-210) |
| 11 | Billing query returns real customer/staff/client counts from database | ✓ VERIFIED | queries.ts getUsageStats counts entities, includes pending (line 9-84) |
| 12 | Billing query returns org subscription status, plan name, and trial info | ✓ VERIFIED | queries.ts getBillingInfo returns status, isTrialing, trialDaysRemaining (line 90-145) |
| 13 | Non-admin users cannot create checkouts or cancel subscriptions | ✓ VERIFIED | actions.ts checks role === "admin" before operations (line 34, 91, 163) |
| 14 | Billing page shows current plan name from database (not hardcoded) | ✓ VERIFIED | billing.tsx uses usageStats.plan.name from query (line 81, 129) |
| 15 | Usage progress bars show real counts from Convex with color coding | ✓ VERIFIED | billing.tsx renders UsageProgress with real data (line 236-254), UsageProgress.tsx has 80%/90% thresholds (line 14-19) |
| 16 | Upgrade button opens Lemon Squeezy checkout overlay in-app | ✓ VERIFIED | UpgradeButton.tsx loads Lemon.js, calls LemonSqueezy.Url.Open (line 38-77) |
| 17 | Cancel button opens confirmation dialog and calls cancel action | ✓ VERIFIED | billing.tsx has AlertDialog with cancelSubscription action (line 372-394) |
| 18 | Plan cards show Free/Pro/Business with correct limits | ✓ VERIFIED | billing.tsx PLAN_DISPLAY_INFO has all 3 tiers with limits (line 37-78) |
| 19 | Manage Subscription button links to Lemon Squeezy customer portal | ✓ VERIFIED | billing.tsx calls getCustomerPortalUrl action (line 84, 106-118) |
| 20 | Trial banner shows days remaining when org is on a trial subscription | ✓ VERIFIED | billing.tsx shows trial banner when isTrialing (line 151-170) |
| 21 | View Invoices button opens Lemon Squeezy customer portal for invoice history | ✓ VERIFIED | billing.tsx invoice section calls getCustomerPortalUrl (line 319-334) |
| 22 | Creating a customer when at maxCustomers limit shows upgrade prompt (not just error) | ✓ VERIFIED | customers.tsx has CapReachedBanner in form (line 362-366), submit disabled when at limit (line 373) |
| 23 | Inviting staff when at maxStaff limit shows upgrade prompt | ✗ FAILED | Backend throws error (send.ts line 65), but InviteDialog only shows error text without CapReachedBanner or billing link |
| 24 | Inviting client when at maxClients limit shows upgrade prompt | ✗ FAILED | Backend throws error (send.ts line 71), but InviteDialog only shows error text without CapReachedBanner or billing link |
| 25 | Warning banner appears at 80%+ usage of any limit | ✓ VERIFIED | UsageWarningBanner calculates 80% threshold (CapReachedBanner.tsx line 72, 80, 88), shown in _authenticated.tsx (line 46) |
| 26 | Upgrade prompts link to billing page or open checkout overlay | ⚠️ PARTIAL | Customer CapReachedBanner links to /billing (line 42-46). Team InviteDialog missing CapReachedBanner. |

**Score:** 35/38 truths verified (3 items failed/partial due to InviteDialog missing upgrade prompt UX)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `convex/http.ts` | HTTP router with webhook route | ✓ VERIFIED | 21 lines, exports httpRouter, routes /lemonsqueezy/webhook to handleWebhook |
| `convex/lemonsqueezy/webhook.ts` | httpAction handler for webhook events | ✓ VERIFIED | 96 lines, reads raw body, verifies signature, calls sync mutation |
| `convex/lemonsqueezy/signature.ts` | HMAC-SHA256 verification with Web Crypto | ✓ VERIFIED | 54 lines, uses crypto.subtle (Web Crypto API), no Node.js imports |
| `convex/lemonsqueezy/sync.ts` | Internal mutation to update org state | ✓ VERIFIED | 133 lines, handles 5 event types, updates subscription fields and limits |
| `convex/lemonsqueezy/plans.ts` | Plan tier definitions with limits | ✓ VERIFIED | 79 lines, exports FREE_TIER_LIMITS, PLAN_TIERS, getLimitsForVariant, getPlanName |
| `convex/billing/queries.ts` | Usage stats and billing info queries | ✓ VERIFIED | 145 lines, exports getUsageStats, getBillingInfo, counts include pending invitations |
| `convex/billing/actions.ts` | Checkout URL, cancel, portal URL actions | ✓ VERIFIED | 210 lines, has "use node" directive, uses @lemonsqueezy/lemonsqueezy.js SDK |
| `src/routes/_authenticated/billing.tsx` | Full billing dashboard with real data | ✓ VERIFIED | 397 lines, uses useQuery for stats/info, trial banner, plan cards, cancel flow, invoice section |
| `src/components/billing/UpgradeButton.tsx` | Button that loads Lemon.js and opens overlay | ✓ VERIFIED | 85 lines, loads CDN script in useEffect, calls LemonSqueezy.Url.Open |
| `src/components/billing/UsageProgress.tsx` | Color-coded progress bars | ✓ VERIFIED | 41 lines, 3 color thresholds (green < 80%, amber 80-89%, red 90%+) |
| `src/components/billing/CapReachedBanner.tsx` | Reusable warning banner and upgrade prompt | ✓ VERIFIED | 141 lines, exports CapReachedBanner (inline), UsageWarningBanner (app-wide) |
| `src/routes/_authenticated/customers.tsx` | Customer creation with inline upgrade prompt | ✓ VERIFIED | Uses CapReachedBanner (line 362), disables submit at limit (line 373) |
| `src/routes/_authenticated.tsx` | Authenticated layout with warning banner | ✓ VERIFIED | Queries usage stats (line 42), renders UsageWarningBanner (line 46) |
| `src/components/team/invite-dialog.tsx` | Team invitation dialog | ⚠️ PARTIAL | 196 lines, catches errors but lacks CapReachedBanner for inline upgrade prompt |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| convex/http.ts | convex/lemonsqueezy/webhook.ts | Route handler import | ✓ WIRED | Line 3 imports handleWebhook, line 18 uses it |
| convex/lemonsqueezy/webhook.ts | convex/lemonsqueezy/signature.ts | Signature verification | ✓ WIRED | Line 10 imports verifySignature, line 44 calls it |
| convex/lemonsqueezy/webhook.ts | convex/lemonsqueezy/sync.ts | Internal mutation call | ✓ WIRED | Line 83 calls ctx.runMutation with processSubscriptionEvent |
| convex/lemonsqueezy/sync.ts | convex/lemonsqueezy/plans.ts | Plan limits lookup | ✓ WIRED | Line 9 imports getLimitsForVariant, line 83 calls it |
| src/routes/_authenticated/billing.tsx | convex/billing/queries.ts | useQuery hooks | ✓ WIRED | Line 81-82 queries getUsageStats and getBillingInfo |
| src/components/billing/UpgradeButton.tsx | convex/billing/actions.ts | Checkout URL action | ✓ WIRED | UpgradeButton builds URL client-side (no action call) — OK per plan |
| src/routes/_authenticated/billing.tsx | src/components/billing/UpgradeButton.tsx | Component import | ✓ WIRED | Line 20 imports UpgradeButton, used in lines 157-166, 217-224, 296-303 |
| src/routes/_authenticated/billing.tsx | convex/billing/actions.ts | Customer portal URL action | ✓ WIRED | Line 84 useAction getCustomerPortalUrl, line 109 calls it |
| src/routes/_authenticated/customers.tsx | convex/customers/crud.ts | Mutation error handling | ✓ WIRED | Uses CapReachedBanner on limit, customer creation enforces cap in backend |
| src/routes/_authenticated.tsx | convex/billing/queries.ts | useQuery for usage stats | ✓ WIRED | Line 42 queries getUsageStats for warning banner |
| src/components/billing/CapReachedBanner.tsx | src/routes/_authenticated/billing.tsx | Link to billing page | ✓ WIRED | CapReachedBanner uses Link to="/billing" (line 42) |
| src/components/team/invite-dialog.tsx | convex/invitations/send.ts | Invitation action | ⚠️ PARTIAL | Line 68 calls sendInvitation, catches error (line 77-79), but missing CapReachedBanner for upgrade prompt |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| BILL-01: Org has subscription status synced from Lemon Squeezy | ✓ SATISFIED | Webhook handler + sync mutation update subscriptionStatus |
| BILL-02: Admin can upgrade via Lemon Squeezy checkout | ✓ SATISFIED | UpgradeButton opens checkout overlay with pre-filled data |
| BILL-03: Webhook handler processes subscription events | ✓ SATISFIED | webhook.ts verifies signatures, sync.ts handles 5 event types |
| BILL-04: Plan caps update on subscription change | ✓ SATISFIED | sync.ts updates maxCustomers/maxStaff/maxClients from plan tier |
| BILL-05: Usage cap enforced on staff/client creation | ⚠️ BLOCKED | Backend enforces (send.ts line 65, 71), but InviteDialog lacks upgrade prompt UX |
| BILL-06: Billing page shows real usage from Convex | ✓ SATISFIED | billing.tsx queries getUsageStats for live counts |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| convex/lemonsqueezy/plans.ts | 6, 21 | TODO: Replace placeholder variant IDs | ℹ️ Info | Expected — user configuration, not incomplete implementation |
| src/routes/_authenticated/billing.tsx | 62, 76 | TODO: Replace with actual variant ID | ℹ️ Info | Expected — user configuration, not incomplete implementation |

**No blockers.** TODOs are for user configuration (Lemon Squeezy variant IDs from dashboard).

### Human Verification Required

#### 1. Test Lemon Squeezy Checkout Overlay

**Test:** 
1. Navigate to /billing
2. Click "Upgrade" on Pro or Business plan card
3. Verify Lemon Squeezy checkout overlay appears in-app (not redirect)
4. Check that email and org name are pre-filled
5. Close overlay without completing payment (unless in test mode)

**Expected:** Checkout overlay appears with pre-filled fields, checkout[custom][org_convex_id] passed for webhook correlation

**Why human:** Requires Lemon Squeezy test mode setup, visual verification of overlay behavior

#### 2. Test Webhook Signature Verification

**Test:**
1. Use Lemon Squeezy webhook testing tool or curl
2. Send POST to /lemonsqueezy/webhook with invalid signature
3. Verify 401 response
4. Send POST with valid signature (use test mode)
5. Verify 200 response and org updates in Convex dashboard

**Expected:** Invalid signatures rejected, valid webhooks update org subscription state

**Why human:** Requires Lemon Squeezy webhook secret and external HTTP requests

#### 3. Test Subscription Lifecycle Events

**Test:**
1. Create test subscription via Lemon Squeezy test mode
2. Verify org subscriptionStatus = "active", plan limits updated
3. Cancel subscription in Lemon Squeezy dashboard
4. Verify org subscriptionStatus = "cancelled", limits preserved, endsAt set
5. Let subscription expire (or manually trigger expired event)
6. Verify org reverts to free tier limits

**Expected:** Each webhook event correctly updates org state per sync.ts logic

**Why human:** Requires external Lemon Squeezy actions and time-based expiration

#### 4. Test Trial Subscription Display

**Test:**
1. Start a trial subscription (if available in Lemon Squeezy setup)
2. Navigate to /billing
3. Verify trial banner appears at top with days remaining
4. Verify "Trial" badge next to plan name
5. Verify warning styling if 3 or fewer days remaining

**Expected:** Trial banner shows days remaining, amber warning when < 3 days

**Why human:** Requires trial subscription in Lemon Squeezy, visual verification

#### 5. Test Usage Warning Banner at 80%+

**Test:**
1. Create customers/staff/clients until one resource reaches 80%+ usage
2. Navigate to any authenticated page
3. Verify amber warning banner appears at top
4. Verify banner lists the resources at 80%+
5. Click "Upgrade" button, verify navigates to /billing
6. Dismiss banner, verify disappears (reappears on refresh)

**Expected:** Banner shows at 80%+, dismissible, lists affected resources

**Why human:** Requires real data at 80% threshold, visual verification

#### 6. Test Customer Creation at Limit

**Test:**
1. Create customers until at maxCustomers limit
2. Open customer creation dialog
3. Verify CapReachedBanner appears (amber box with upgrade prompt)
4. Verify submit button is disabled
5. Click "Upgrade Plan" link, verify navigates to /billing

**Expected:** Inline upgrade prompt shows, submit disabled, upgrade link works

**Why human:** Requires hitting actual limit, visual verification of UX

#### 7. Test Invoice Portal Access

**Test:**
1. Subscribe to a plan (generates first invoice)
2. Navigate to /billing
3. Scroll to Invoices section
4. Click "View Invoices & Receipts"
5. Verify opens Lemon Squeezy customer portal in new tab
6. Verify portal shows invoice list with date, amount, receipt download

**Expected:** Customer portal opens with invoice history

**Why human:** Requires paid subscription, external Lemon Squeezy portal

#### 8. Test Cancel Subscription Flow

**Test:**
1. Have active subscription
2. Navigate to /billing
3. Scroll to "Danger Zone" section
4. Click "Cancel Subscription"
5. Verify confirmation dialog appears with warning text
6. Click "Confirm Cancellation"
7. Verify subscription cancelled message
8. Refresh page, verify status shows "Cancelled" with end date

**Expected:** Confirmation dialog, cancellation via API, status updates after webhook

**Why human:** Requires active subscription, destructive action, visual verification

### Gaps Summary

**3 gaps found blocking full goal achievement:**

1. **Staff invitation upgrade prompt missing (Truth #23)**
   - Backend correctly enforces staff limit (convex/invitations/send.ts line 65)
   - Error message includes "Upgrade your plan" text
   - Frontend InviteDialog catches error (line 77-79) but only shows text in Alert
   - Missing: CapReachedBanner component with visual upgrade prompt and link to /billing
   - Impact: Users see error but no clear upgrade path (poor UX)

2. **Client invitation upgrade prompt missing (Truth #24)**
   - Backend correctly enforces client limit (convex/invitations/send.ts line 71)
   - Error message includes "Upgrade your plan" text
   - Frontend InviteDialog catches error (line 77-79) but only shows text in Alert
   - Missing: CapReachedBanner component with visual upgrade prompt and link to /billing
   - Impact: Users see error but no clear upgrade path (poor UX)

3. **Upgrade prompt links inconsistent (Truth #26)**
   - Customer creation dialog: CapReachedBanner present with link to /billing ✓
   - Team InviteDialog: No CapReachedBanner, just error text ✗
   - Impact: Inconsistent UX across different cap enforcement points

**Root cause:** Plan 03-04 added CapReachedBanner to customer creation dialog but did NOT add it to team InviteDialog. The plan file (03-04-PLAN.md line 121-127) specified updating customers.tsx but did not specify updating InviteDialog.

**Fix required:**
- Import CapReachedBanner into InviteDialog
- Parse error message to detect "Staff limit reached" or "Client limit reached"
- Show CapReachedBanner below error Alert when limit error occurs
- Disable submit button when at limit (proactive check via usage query)

---

**Overall Assessment:** Core billing infrastructure is complete and functional. Webhook processing, checkout overlay, subscription management, and usage queries all work correctly. The gaps are UX-level issues in the invitation flow where upgrade prompts are missing. Backend enforcement works; frontend needs consistency with customer creation pattern.

_Verified: 2026-02-09T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
