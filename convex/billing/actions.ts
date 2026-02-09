"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import { lemonSqueezySetup, cancelSubscription as lsCancelSubscription, getCustomer } from "@lemonsqueezy/lemonsqueezy.js";

/**
 * Create a checkout URL for a specific plan variant
 * Admin-only action that builds a pre-filled Lemon Squeezy checkout URL
 */
export const createCheckoutUrl = action({
  args: {
    variantId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get user record and verify admin role
    const userRecord = await ctx.runQuery(internal.invitations.internal.getUserRecord, {
      workosUserId,
    });

    if (!userRecord) {
      throw new ConvexError("User record not found");
    }

    if (userRecord.role !== "admin") {
      throw new ConvexError("Admin role required to create checkout URL");
    }

    if (!userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    // Get org details
    const org = await ctx.runQuery(internal.orgs.get.getMyOrgInternal, {
      workosUserId,
    });

    if (!org) {
      throw new ConvexError("Organization not found");
    }

    // Build checkout URL with pre-filled data
    const storeSlug = process.env.LEMONSQUEEZY_STORE_SLUG;
    if (!storeSlug) {
      throw new ConvexError("LEMONSQUEEZY_STORE_SLUG not configured");
    }

    const checkoutUrl = new URL(`https://${storeSlug}.lemonsqueezy.com/checkout/buy/${args.variantId}`);
    checkoutUrl.searchParams.set("checkout[email]", userRecord.email);
    checkoutUrl.searchParams.set("checkout[name]", org.name);
    checkoutUrl.searchParams.set("checkout[custom][org_convex_id]", org._id);

    return { checkoutUrl: checkoutUrl.toString() };
  },
});

/**
 * Cancel the current organization's subscription
 * Admin-only action that initiates cancellation with Lemon Squeezy
 * Note: Actual status update happens via webhook (subscription_cancelled event)
 */
export const cancelSubscription = action({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get user record and verify admin role
    const userRecord = await ctx.runQuery(internal.invitations.internal.getUserRecord, {
      workosUserId,
    });

    if (!userRecord) {
      throw new ConvexError("User record not found");
    }

    if (userRecord.role !== "admin") {
      throw new ConvexError("Admin role required to cancel subscription");
    }

    if (!userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    // Get org details
    const org = await ctx.runQuery(internal.orgs.get.getMyOrgInternal, {
      workosUserId,
    });

    if (!org) {
      throw new ConvexError("Organization not found");
    }

    if (!org.subscriptionId) {
      throw new ConvexError("No active subscription to cancel");
    }

    try {
      // Initialize Lemon Squeezy SDK
      const apiKey = process.env.LEMONSQUEEZY_API_KEY;
      if (!apiKey) {
        throw new ConvexError("LEMONSQUEEZY_API_KEY not configured");
      }

      lemonSqueezySetup({ apiKey });

      // Call Lemon Squeezy API to cancel subscription
      const result = await lsCancelSubscription(org.subscriptionId);

      if (result.error) {
        throw new ConvexError(`Failed to cancel subscription: ${result.error.message}`);
      }

      return {
        success: true,
        endsAt: result.data?.data.attributes.ends_at || null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ConvexError(`Failed to cancel subscription: ${message}`);
    }
  },
});

/**
 * Get customer portal URL for the current organization
 * Admin-only action that returns a pre-signed URL to the Lemon Squeezy customer portal
 * where users can view invoices, receipts, and manage payment methods
 */
export const getCustomerPortalUrl = action({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get user record and verify admin role
    const userRecord = await ctx.runQuery(internal.invitations.internal.getUserRecord, {
      workosUserId,
    });

    if (!userRecord) {
      throw new ConvexError("User record not found");
    }

    if (userRecord.role !== "admin") {
      throw new ConvexError("Admin role required to access customer portal");
    }

    if (!userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    // Get org details
    const org = await ctx.runQuery(internal.orgs.get.getMyOrgInternal, {
      workosUserId,
    });

    if (!org) {
      throw new ConvexError("Organization not found");
    }

    // Check if org has a Lemon Squeezy customer ID
    if (!org.lemonSqueezyCustomerId) {
      return { portalUrl: null };
    }

    try {
      // Initialize Lemon Squeezy SDK
      const apiKey = process.env.LEMONSQUEEZY_API_KEY;
      if (!apiKey) {
        throw new ConvexError("LEMONSQUEEZY_API_KEY not configured");
      }

      lemonSqueezySetup({ apiKey });

      // Get customer object from Lemon Squeezy
      const result = await getCustomer(org.lemonSqueezyCustomerId);

      if (result.error) {
        throw new ConvexError(`Failed to get customer portal: ${result.error.message}`);
      }

      const portalUrl = result.data?.data.attributes.urls.customer_portal || null;

      return { portalUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ConvexError(`Failed to get customer portal URL: ${message}`);
    }
  },
});
