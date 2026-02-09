# Phase 3: Billing - Research

**Researched:** 2026-02-09
**Domain:** Lemon Squeezy subscription billing with Convex backend
**Confidence:** MEDIUM

## Summary

This phase integrates Lemon Squeezy for subscription billing with Convex as the backend. The standard approach involves three core components: (1) Lemon.js for embedded checkout overlays, (2) HTTP webhook handlers in Convex to sync subscription state, and (3) the official @lemonsqueezy/lemonsqueezy.js SDK for server-side API calls.

Lemon Squeezy uses HMAC-SHA256 signature verification for webhooks, which requires Web Crypto API (not Node.js crypto) in Convex's runtime. The platform provides checkout overlays that embed directly in React apps, pre-signed customer portal URLs for self-service management, and comprehensive webhook events for subscription lifecycle tracking.

Usage cap enforcement already exists in the codebase for customers (maxCustomers limit) and invitations (maxStaff/maxClients limits). The same pattern extends to billing: check count against org limits, throw ConvexError with upgrade message when at capacity, display inline upgrade prompts in creation dialogs.

**Primary recommendation:** Use Lemon Squeezy checkout overlay (not redirect), implement HTTP action webhook handler with Web Crypto signature verification, sync subscription status to existing org schema fields, leverage pre-signed portal URLs for cancellation/management.

## Standard Stack

The established libraries/tools for Lemon Squeezy + Convex integration:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @lemonsqueezy/lemonsqueezy.js | Latest | Official Lemon Squeezy SDK | TypeScript-first, tree-shakeable, documented with TSDoc, official SDK |
| Lemon.js (CDN) | Latest | Checkout overlay library | Lightweight (2.3kB), official client library, framework-agnostic |
| Web Crypto API | Native | Webhook signature verification | Built into modern runtimes, no dependencies, Convex-compatible |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 (already installed) | Date formatting for trials/renewals | Existing dependency, format renewal dates in UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lemon.js | Redirect to checkout URL | Overlay provides better UX, keeps users in-app, allows pre-filling data |
| Web Crypto API | Node.js crypto module | Node crypto not available in Convex runtime, Web Crypto is standard |
| @lemonsqueezy/lemonsqueezy.js | lemonsqueezy.ts (deprecated) | Official SDK is actively maintained, deprecated package warns against use |

**Installation:**
```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

No installation needed for Lemon.js (loaded via CDN) or Web Crypto API (native).

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── http.ts                    # HTTP router with webhook endpoint
├── lemonsqueezy/
│   ├── webhook.ts            # Webhook handler (httpAction)
│   ├── sync.ts               # Internal mutations to update org
│   └── signature.ts          # Signature verification helper
└── billing/
    ├── queries.ts            # Get usage stats, plan info
    └── actions.ts            # Create checkout URL, cancel subscription

src/
├── routes/
│   └── _authenticated/
│       └── billing.tsx       # Billing dashboard (already exists)
└── components/
    └── billing/
        ├── UpgradeButton.tsx      # Trigger Lemon.js overlay
        ├── UsageProgress.tsx      # Progress bars with colors
        └── CapReachedDialog.tsx   # Inline upgrade prompt
```

### Pattern 1: Lemon.js Checkout Overlay in React

**What:** Load Lemon.js dynamically and trigger programmatic overlay
**When to use:** Any checkout/upgrade flow where you want to pre-fill customer data

**Example:**
```typescript
// Source: https://docs.lemonsqueezy.com/help/lemonjs/using-with-frameworks-libraries
import { useEffect, useState } from "react";

export function UpgradeButton({ variantId, email, orgName }) {
  const [lemonLoaded, setLemonLoaded] = useState(false);

  useEffect(() => {
    // Load Lemon.js script
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    script.onload = () => {
      setLemonLoaded(true);
      window.createLemonSqueezy(); // Initialize for React
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = () => {
    if (!lemonLoaded) return;

    // Pre-fill checkout with customer data
    const checkoutUrl = `https://[STORE].lemonsqueezy.com/checkout/buy/${variantId}?checkout[email]=${encodeURIComponent(email)}&checkout[name]=${encodeURIComponent(orgName)}`;

    window.LemonSqueezy.Url.Open(checkoutUrl);
  };

  return (
    <button onClick={handleUpgrade} disabled={!lemonLoaded}>
      Upgrade Plan
    </button>
  );
}
```

### Pattern 2: Convex HTTP Webhook Handler

**What:** Receive and verify Lemon Squeezy webhooks, sync subscription to database
**When to use:** All subscription lifecycle events (created, updated, cancelled, etc.)

**Example:**
```typescript
// Source: https://docs.convex.dev/functions/http-actions
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/lemonsqueezy/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("X-Signature");

    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    // Verify signature using Web Crypto API
    const isValid = await verifySignature(
      signature,
      rawBody,
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse webhook payload
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

    // Process subscription events
    if (eventName.startsWith("subscription_")) {
      await ctx.runMutation(internal.lemonsqueezy.sync.processSubscriptionEvent, {
        eventName,
        subscription: payload.data,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
```

### Pattern 3: Web Crypto Signature Verification

**What:** Verify webhook signatures without Node.js crypto module
**When to use:** Convex runtime and other edge environments

**Example:**
```typescript
// Source: https://robingenz.dev/blog/validate-lemon-squeezy-webhook-requests-in-cloudflare-workers/
// Adapted for Convex runtime
async function verifySignature(
  signature: string,
  body: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();

  // Import secret as HMAC key
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign body with HMAC-SHA256
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );

  // Convert digest to hex string
  const calculated = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison
  return calculated === signature;
}
```

### Pattern 4: Usage Cap Enforcement with Inline Prompts

**What:** Block action when limit reached, show upgrade prompt in same dialog
**When to use:** Customer creation, staff invitation, client invitation

**Example:**
```typescript
// Source: Existing codebase pattern in convex/customers/crud.ts
// convex/invitations/send.ts pattern
export const inviteStaff = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const org = await getOrgForUser(ctx);

    // Count existing + pending staff
    const counts = await getStaffCounts(ctx, org._id);

    // Hard block at limit
    if (counts.staffCount + counts.pendingStaffCount >= org.maxStaff) {
      throw new ConvexError(
        `Staff limit reached (${org.maxStaff}). Upgrade your plan to invite more staff members.`
      );
    }

    // Proceed with invitation...
  }
});

// Frontend: Catch error and show inline upgrade prompt
try {
  await inviteStaff({ email });
} catch (error) {
  if (error.message.includes("limit reached")) {
    // Show upgrade button inside the invite dialog
    setShowUpgradePrompt(true);
  }
}
```

### Pattern 5: Subscription State Sync from Webhooks

**What:** Update org subscription fields when webhook events arrive
**When to use:** subscription_created, subscription_updated, subscription_cancelled events

**Example:**
```typescript
// convex/lemonsqueezy/sync.ts
export const processSubscriptionEvent = internalMutation({
  args: {
    eventName: v.string(),
    subscription: v.any(), // Full Lemon Squeezy subscription object
  },
  handler: async (ctx, args) => {
    const { subscription } = args;

    // Find org by Lemon Squeezy customer ID (stored in WorkOS metadata)
    const org = await ctx.db
      .query("orgs")
      .filter(q => q.eq(q.field("customerId"), subscription.attributes.customer_id))
      .first();

    if (!org) return; // Org not found, skip

    // Map subscription status to org fields
    const updates = {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.attributes.status, // "active", "cancelled", etc.
      planId: subscription.attributes.variant_id,
      updatedAt: Date.now(),
    };

    // Update plan caps based on variant
    if (subscription.attributes.variant_id === VARIANT_ID_PRO) {
      updates.maxCustomers = 25;
      updates.maxStaff = 10;
      updates.maxClients = 100;
    } else if (subscription.attributes.variant_id === VARIANT_ID_BUSINESS) {
      updates.maxCustomers = 100;
      updates.maxStaff = 50;
      updates.maxClients = 500;
    } else {
      // Free tier defaults
      updates.maxCustomers = 3;
      updates.maxStaff = 2;
      updates.maxClients = 10;
    }

    await ctx.db.patch(org._id, updates);
  },
});
```

### Pattern 6: Progress Bar Color Thresholds

**What:** Visual urgency indicator for usage approaching limits
**When to use:** Billing dashboard usage displays

**Example:**
```typescript
// src/components/billing/UsageProgress.tsx
function getUsageColor(percentage: number): string {
  if (percentage >= 90) return "bg-red-500";      // 90%+ = red (danger)
  if (percentage >= 80) return "bg-yellow-500";   // 80-89% = yellow (warning)
  return "bg-green-500";                          // <80% = green (normal)
}

function UsageProgress({ used, max, label }) {
  const percentage = Math.min((used / max) * 100, 100);
  const color = getUsageColor(percentage);

  return (
    <div>
      <div className="text-sm">{label}: {used}/{max}</div>
      <div className="h-2 bg-gray-200 rounded">
        <div
          className={`h-full rounded ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Redirecting to Lemon Squeezy checkout:** Use overlay instead for better UX and ability to pre-fill data
- **Using Node.js crypto in Convex:** Will fail at runtime; use Web Crypto API instead
- **Not verifying webhook signatures:** Security risk; always verify before processing
- **Returning non-200 from webhook handler:** Triggers unnecessary retries; return 200 even if you skip processing
- **Storing raw subscription object in database:** Extract needed fields only (status, variantId, customerId)
- **Soft limits with overage billing:** User decided on hard blocks; prevent action entirely when limit reached

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC implementation | Web Crypto API `crypto.subtle.sign()` | Timing-safe comparison built-in, standard API, no dependencies |
| Checkout UI | Custom payment form | Lemon.js overlay | PCI compliance handled, pre-fills data, mobile-optimized |
| Customer portal | Admin panel for subscriptions | Lemon Squeezy customer portal URLs | Self-service cancellation, plan changes, payment methods |
| Subscription retry logic | Custom webhook retry handler | Lemon Squeezy automatic retries | Exponential backoff built-in (5s, 25s, 125s intervals) |
| Invoice display | Custom invoice generation | Lemon Squeezy receipt URLs | Tax calculations, compliance, downloadable PDFs |
| Trial period tracking | Custom date logic | Lemon Squeezy `trial_ends_at` field | Handles grace periods, trial-to-paid conversion |

**Key insight:** Lemon Squeezy is a Merchant of Record (MoR), handling tax, compliance, and payment processing complexity. Lean on their infrastructure rather than rebuilding payment flows.

## Common Pitfalls

### Pitfall 1: Lemon.js Initialization Timing in React
**What goes wrong:** Lemon.js script loads before React component renders, button listeners not attached
**Why it happens:** Script initializes on load, but React components mount after DOM ready
**How to avoid:** Call `window.createLemonSqueezy()` in `useEffect` after component mounts
**Warning signs:** Clicking checkout button does nothing, no overlay appears

### Pitfall 2: Processing Webhook Before Verification
**What goes wrong:** Malicious webhook payloads could update subscription data
**Why it happens:** Eager parsing of request body before signature check
**How to avoid:** Verify signature first, return 401 if invalid, only then parse JSON
**Warning signs:** Security audit finds webhook endpoint accepts unauthenticated requests

### Pitfall 3: Modifying Request Body Before Signature Verification
**What goes wrong:** Signature verification fails even for legitimate webhooks
**Why it happens:** Reading `request.json()` consumes the body, signature needs raw text
**How to avoid:** Use `request.text()` first for verification, then `JSON.parse()` the text
**Warning signs:** All webhooks fail signature check with 401 responses

### Pitfall 4: Not Handling Trial Expiration
**What goes wrong:** Users keep Pro features after 14-day trial ends without payment
**Why it happens:** No webhook handler for `subscription_expired` event
**How to avoid:** Subscribe to `subscription_expired`, reset org to free tier limits on expiration
**Warning signs:** Users report losing access abruptly, or keeping access they shouldn't have

### Pitfall 5: Hardcoding Plan Limits in Frontend
**What goes wrong:** Mismatched limits between backend enforcement and frontend display
**Why it happens:** Limits defined in multiple places (schema defaults, webhook sync, UI components)
**How to avoid:** Single source of truth: org schema fields, query from Convex, display dynamically
**Warning signs:** UI shows different limits than error messages, users confused about actual caps

### Pitfall 6: Forgetting Subscription Cancellation Grace Period
**What goes wrong:** Users lose access immediately on cancellation, but were billed for full month
**Why it happens:** Misunderstanding Lemon Squeezy's grace period behavior
**How to avoid:** Status "cancelled" means active until `ends_at` date; check both status and `ends_at`
**Warning signs:** Support tickets about "immediate loss of access after cancellation"

### Pitfall 7: Using Same API Key for Test and Production
**What goes wrong:** Test webhooks update production database or vice versa
**Why it happens:** Not maintaining separate Lemon Squeezy stores for development
**How to avoid:** Separate API keys in `.env` files, use Lemon Squeezy's test mode
**Warning signs:** Unexpected subscription changes in production from developer testing

## Code Examples

Verified patterns from official sources:

### Pre-filling Checkout Fields
```typescript
// Source: https://docs.lemonsqueezy.com/help/checkout/prefilled-checkout-fields
const checkoutUrl = new URL(`https://[STORE].lemonsqueezy.com/checkout/buy/${variantId}`);
checkoutUrl.searchParams.set("checkout[email]", user.email);
checkoutUrl.searchParams.set("checkout[name]", org.name);
// Optional: Pass org ID for webhook correlation
checkoutUrl.searchParams.set("checkout[custom][org_id]", org.workosOrgId);

window.LemonSqueezy.Url.Open(checkoutUrl.toString());
```

### Webhook Event Processing
```typescript
// Source: https://docs.lemonsqueezy.com/guides/developer-guide/webhooks
// Key events for subscription billing
switch (payload.meta.event_name) {
  case "subscription_created":
    // New subscription: activate Pro features
    await syncSubscription(payload.data);
    break;

  case "subscription_updated":
    // Plan change or renewal: update limits
    await syncSubscription(payload.data);
    break;

  case "subscription_payment_success":
    // Successful renewal: ensure active status
    await updatePaymentStatus(payload.data);
    break;

  case "subscription_payment_failed":
    // Failed payment: notify user, keep active during retries
    await notifyPaymentFailure(payload.data);
    break;

  case "subscription_cancelled":
    // Cancellation: keep active until ends_at
    await markAsCancelled(payload.data);
    break;

  case "subscription_expired":
    // Grace period ended: downgrade to free
    await downgradeToFree(payload.data);
    break;
}
```

### Subscription Cancellation via API
```typescript
// Source: https://docs.lemonsqueezy.com/api/subscriptions/cancel-subscription
import { lemonSqueezySetup, cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js";

// Setup (once, server-side only)
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error("Lemon Squeezy error:", error),
});

// Cancel subscription
const result = await cancelSubscription(subscriptionId);
if (result.error) {
  throw new Error(result.error.message);
}

// Result includes updated subscription with status "cancelled"
const { status, ends_at } = result.data.data.attributes;
console.log(`Cancelled, active until: ${ends_at}`);
```

### Getting Usage Counts for Dashboard
```typescript
// Source: Existing pattern in convex/customers/crud.ts
// convex/billing/queries.ts
export const getUsageStats = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Not authenticated");

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", q => q.eq("workosUserId", user.subject))
      .first();

    if (!userRecord?.orgId) throw new ConvexError("No org");

    const org = await ctx.db.get(userRecord.orgId);
    if (!org) throw new ConvexError("Org not found");

    // Count customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_org", q => q.eq("orgId", org._id))
      .collect();

    // Count staff (active users with role "staff")
    const staff = await ctx.db
      .query("users")
      .withIndex("by_org_role", q => q.eq("orgId", org._id).eq("role", "staff"))
      .filter(q => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Count clients
    const clients = await ctx.db
      .query("users")
      .withIndex("by_org_role", q => q.eq("orgId", org._id).eq("role", "client"))
      .filter(q => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return {
      plan: {
        name: org.subscriptionStatus === "active" ? "Pro" : "Free",
        status: org.subscriptionStatus || "inactive",
      },
      usage: {
        customers: { count: customers.length, max: org.maxCustomers },
        staff: { count: staff.length, max: org.maxStaff },
        clients: { count: clients.length, max: org.maxClients },
      },
    };
  },
});
```

### Creating Checkout Session with Custom Data
```typescript
// Source: https://docs.lemonsqueezy.com/help/checkout/passing-custom-data
// Pass org WorkOS ID to correlate webhook with database record
const checkoutUrl = new URL(`https://[STORE].lemonsqueezy.com/checkout/buy/${variantId}`);

// Pre-fill customer info
checkoutUrl.searchParams.set("checkout[email]", user.email);
checkoutUrl.searchParams.set("checkout[name]", org.name);

// Custom data available in webhooks
checkoutUrl.searchParams.set("checkout[custom][workos_org_id]", org.workosOrgId);
checkoutUrl.searchParams.set("checkout[custom][org_convex_id]", org._id);

// Webhook payload will include:
// payload.meta.custom_data = { workos_org_id: "...", org_convex_id: "..." }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stripe Elements | Lemon Squeezy overlay | 2023+ | Merchant of Record vs. payment processor; LS handles tax/compliance |
| Redirect to hosted checkout | Embedded overlay | 2023 (LS launch) | Better UX, no navigation away, pre-fill data |
| Node.js crypto for webhooks | Web Crypto API | Edge runtime adoption | Serverless/edge compatibility, standard API |
| lemonsqueezy.ts (community) | @lemonsqueezy/lemonsqueezy.js | 2024 (official SDK) | TypeScript-first, tree-shakeable, maintained |
| Manual plan limit storage | Variant metadata | Not yet available | Feature requested but not shipped; must store limits separately |

**Deprecated/outdated:**
- **lemonsqueezy.ts npm package**: Deprecated in favor of official @lemonsqueezy/lemonsqueezy.js SDK
- **Lemon Squeezy redirect-only checkout**: Overlay is now standard; redirect still works but worse UX
- **Node.js-specific crypto libraries**: Use Web Crypto API for edge/serverless compatibility

## Open Questions

Things that couldn't be fully resolved:

1. **Trial-to-Free Downgrade Behavior**
   - What we know: 14-day Pro trial for new users, should drop to Free if no subscription
   - What's unclear: Does Lemon Squeezy send `subscription_expired` when trial ends without payment, or is this a separate flow?
   - Recommendation: Test trial flow in Lemon Squeezy test mode, confirm `subscription_expired` event fires on trial expiration. If not, may need to track `trial_ends_at` and schedule Convex action to downgrade.

2. **Plan Limit Metadata Storage**
   - What we know: Plan limits (maxCustomers, maxStaff, maxClients) must be stored somewhere
   - What's unclear: Lemon Squeezy doesn't support custom metadata on product variants (feature requested but not shipped)
   - Recommendation: Hardcode variant ID → limits mapping in Convex sync function. Alternative: create local "plans" table in Convex and manually sync.

3. **Downgrade Over-Limit Handling**
   - What we know: User can downgrade from Pro (25 customers) to Free (3 customers) while having 15 customers
   - What's unclear: Best UX for this scenario (block downgrade? allow but block new customers? soft warning?)
   - Recommendation: Allow downgrade (don't delete data), block creation of new resources over free limit, show warning "You have 15 customers but Free allows 3. Upgrade to manage all customers."

4. **Invoice Access from Convex**
   - What we know: Subscription invoices available via API and webhook events
   - What's unclear: Should invoices be stored in Convex or just link to Lemon Squeezy portal?
   - Recommendation: Don't store invoices in Convex; display "View Invoices" button that opens pre-signed `customer_portal` URL. Simplest approach, LS handles compliance/tax.

5. **Multiple Subscriptions per Org**
   - What we know: Schema has single `subscriptionId` field on orgs table
   - What's unclear: Can an org have multiple subscriptions (e.g., Pro + add-ons)?
   - Recommendation: Phase 3 scope is single subscription per org (Pro or Business tier). Multi-subscription support is v2 feature if needed.

## Sources

### Primary (HIGH confidence)
- [Lemon Squeezy Checkout Overlay Docs](https://docs.lemonsqueezy.com/help/checkout/checkout-overlay) - Overlay integration
- [Lemon Squeezy Webhook Guide](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks) - Event handling best practices
- [Lemon Squeezy Signing Requests](https://docs.lemonsqueezy.com/help/webhooks/signing-requests) - HMAC-SHA256 verification
- [Lemon Squeezy Webhook Event Types](https://docs.lemonsqueezy.com/help/webhooks/event-types) - Complete event catalog
- [Lemon Squeezy Subscription Object](https://docs.lemonsqueezy.com/api/subscriptions/the-subscription-object) - Status values, attributes
- [Lemon Squeezy Pre-filled Checkout](https://docs.lemonsqueezy.com/help/checkout/prefilled-checkout-fields) - URL parameters
- [Lemon Squeezy Cancel Subscription API](https://docs.lemonsqueezy.com/api/subscriptions/cancel-subscription) - DELETE endpoint
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) - Webhook handler pattern
- [Lemon.js with Frameworks](https://docs.lemonsqueezy.com/help/lemonjs/using-with-frameworks-libraries) - React integration
- [Convex Webhooks Example](https://stack.convex.dev/webhooks-with-convex) - Discord webhook pattern

### Secondary (MEDIUM confidence)
- [Robin Genz: Web Crypto Webhook Validation](https://robingenz.dev/blog/validate-lemon-squeezy-webhook-requests-in-cloudflare-workers/) - Edge runtime verification
- [Lemon Squeezy Next.js Billing Tutorial](https://docs.lemonsqueezy.com/guides/tutorials/nextjs-saas-billing) - Plan sync patterns
- [Lemon Squeezy SaaS Free Trials](https://docs.lemonsqueezy.com/guides/tutorials/saas-free-trials) - Trial setup guide

### Tertiary (LOW confidence)
- [Stigg: Usage-Based Pricing Guide](https://www.stigg.io/blog-posts/beyond-metering-the-only-guide-youll-ever-need-to-implement-usage-based-pricing) - Hard vs. soft limits (general SaaS pattern, not LS-specific)
- [Carbon Design: Status Indicators](https://carbondesignsystem.com/patterns/status-indicator-pattern/) - Progress bar color standards
- [NN/g: Progress Indicators](https://www.nngroup.com/articles/progress-indicators/) - UX timing thresholds

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK documented, Lemon.js is standard client library, Web Crypto API verified in edge contexts
- Architecture: MEDIUM - Patterns verified from official docs, but Convex-specific integration required adaptation from Next.js examples
- Pitfalls: MEDIUM - Based on official docs warnings, community blog posts, and runtime limitations (no Node crypto in Convex)

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable billing domain, unlikely to change rapidly)
