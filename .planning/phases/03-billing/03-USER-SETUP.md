# Phase 3 Billing - User Setup Guide

This guide covers the manual setup steps required to complete the billing integration with Lemon Squeezy.

## Prerequisites

- Lemon Squeezy account (sign up at https://lemonsqueezy.com)
- Convex deployment URL for webhook endpoint
- Products and variants created in Lemon Squeezy dashboard

---

## Step 1: Create Products and Variants in Lemon Squeezy

1. **Navigate to:** Lemon Squeezy Dashboard → Products → Create Product
2. **Create two products** (or variants within one product):
   - **Pro Plan**: Price of your choice, for small agencies
   - **Business Plan**: Price of your choice, for growing agencies

3. **Copy variant IDs** after creating products:
   - Go to: Products → [Your Product] → Variants
   - Copy the variant ID for each plan (looks like a number or string ID)

4. **Update variant IDs in code:**
   - File: `convex/lemonsqueezy/plans.ts`
   - Replace `"VARIANT_PRO"` with actual Pro variant ID
   - Replace `"VARIANT_BUSINESS"` with actual Business variant ID

**Example:**
```typescript
export const PLAN_TIERS = {
  // Replace these with real variant IDs from Lemon Squeezy
  "123456": {  // ← Your actual Pro variant ID
    name: "Pro",
    maxCustomers: 25,
    maxStaff: 10,
    maxClients: 100,
  },
  "789012": {  // ← Your actual Business variant ID
    name: "Business",
    maxCustomers: 100,
    maxStaff: 50,
    maxClients: 500,
  },
} as const;
```

---

## Step 2: Configure Webhook in Lemon Squeezy

### Get Your Webhook URL

Your Convex webhook URL format:
```
https://[your-deployment].convex.cloud/lemonsqueezy/webhook
```

**Find your deployment URL:**
1. Run `npx convex dev` or `npx convex deploy`
2. Check `.env.local` for `CONVEX_DEPLOYMENT` value
3. Construct URL: `https://[CONVEX_DEPLOYMENT].convex.cloud/lemonsqueezy/webhook`

### Create Webhook Endpoint

1. **Navigate to:** Lemon Squeezy Dashboard → Settings → Webhooks
2. **Click:** "Add endpoint"
3. **Enter webhook URL** (from above)
4. **Select events** to send (select all subscription events):
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_payment_failed`
5. **Copy the signing secret** (shown after creating webhook)

---

## Step 3: Environment Variables

Add the following environment variables to your deployment:

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Signing secret from webhook | Lemon Squeezy Dashboard → Settings → Webhooks → [Your webhook] → Signing secret |
| `LEMONSQUEEZY_API_KEY` | API key for server-side operations | Lemon Squeezy Dashboard → Settings → API → API keys → Create new key |
| `LEMONSQUEEZY_STORE_ID` | Your store ID | Lemon Squeezy Dashboard → Settings → Stores → Store ID |
| `LEMONSQUEEZY_STORE_SLUG` | Your store subdomain slug | Lemon Squeezy Dashboard → Settings → Stores → Store slug (e.g., 'mystore' from mystore.lemonsqueezy.com) |

**Note:** The API key and store credentials are required for server-side API calls (checkout URL creation, subscription cancellation, customer portal access).

### Development (.env.local)

Add to your `.env.local` file:
```bash
LEMONSQUEEZY_WEBHOOK_SECRET="your_signing_secret_here"
LEMONSQUEEZY_API_KEY="your_api_key_here"
LEMONSQUEEZY_STORE_ID="your_store_id_here"
LEMONSQUEEZY_STORE_SLUG="your_store_slug_here"
```

### Production (Convex Dashboard)

1. **Navigate to:** Convex Dashboard → Settings → Environment Variables
2. **Add all four variables:**
   - Name: `LEMONSQUEEZY_WEBHOOK_SECRET`, Value: [Your signing secret]
   - Name: `LEMONSQUEEZY_API_KEY`, Value: [Your API key]
   - Name: `LEMONSQUEEZY_STORE_ID`, Value: [Your store ID]
   - Name: `LEMONSQUEEZY_STORE_SLUG`, Value: [Your store slug]
3. **Redeploy** after adding environment variables

---

## Step 4: Verify Webhook Setup

### Test Webhook Delivery

1. **Trigger a test event** in Lemon Squeezy:
   - Go to: Dashboard → Settings → Webhooks → [Your webhook] → "Send test event"
   - Select event type: `subscription_created`

2. **Check webhook logs:**
   - Lemon Squeezy: Dashboard → Settings → Webhooks → [Your webhook] → Recent deliveries
   - Should see 200 OK response

3. **Check Convex logs:**
   - Convex Dashboard → Logs
   - Should see webhook processing without errors
   - Look for: `processSubscriptionEvent` execution

### Common Issues

**401 Invalid signature:**
- Check that `LEMONSQUEEZY_WEBHOOK_SECRET` matches signing secret exactly
- Ensure no extra spaces or newlines in secret value

**500 Webhook secret not configured:**
- Add `LEMONSQUEEZY_WEBHOOK_SECRET` environment variable
- Redeploy Convex functions after adding variable

**Webhook not found (404):**
- Verify webhook URL matches your Convex deployment
- Check that `convex/http.ts` is deployed (run `npx convex deploy`)

---

## Step 5: Test Subscription Flow

### Create Test Subscription

1. **Checkout URL format:**
   ```
   https://[your-store].lemonsqueezy.com/checkout/buy/[variant-id]?checkout[custom][org_convex_id]=[org-id]
   ```

2. **Get org Convex ID:**
   - Convex Dashboard → Data → orgs table
   - Copy the `_id` field for test org

3. **Create checkout link** with custom data:
   - The `org_convex_id` in checkout URL links subscription to org
   - After successful purchase, webhook fires and updates org

4. **Verify subscription created:**
   - Check orgs table: `subscriptionId`, `subscriptionStatus`, `planId` fields populated
   - Plan limits updated: `maxCustomers`, `maxStaff`, `maxClients`

---

## Summary Checklist

- [ ] Products and variants created in Lemon Squeezy
- [ ] Variant IDs updated in `convex/lemonsqueezy/plans.ts`
- [ ] Webhook endpoint created with correct URL
- [ ] All subscription events selected in webhook
- [ ] `LEMONSQUEEZY_WEBHOOK_SECRET` added to environment variables
- [ ] `LEMONSQUEEZY_API_KEY` added to environment variables
- [ ] `LEMONSQUEEZY_STORE_ID` added to environment variables
- [ ] `LEMONSQUEEZY_STORE_SLUG` added to environment variables
- [ ] Test webhook delivers successfully (200 OK)
- [ ] Test subscription updates org in Convex database

---

## Next Steps

After completing this setup:
1. Proceed to Plan 03-02: Build checkout flow UI
2. Implement customer portal for subscription management
3. Add billing page with plan upgrade/downgrade UI
