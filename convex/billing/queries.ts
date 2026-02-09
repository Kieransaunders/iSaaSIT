import { query } from "../_generated/server";
import { ConvexError } from "convex/values";
import { getPlanName } from "../lemonsqueezy/plans";

/**
 * Get usage statistics for the current organization
 * Returns counts of customers, staff, and clients against plan limits
 */
export const getUsageStats = query({
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Find user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord || !userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    // Get org details for limits
    const org = await ctx.db.get(userRecord.orgId);
    if (!org) {
      throw new ConvexError("Organization not found");
    }

    // Count customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_org", (q) => q.eq("orgId", userRecord.orgId!))
      .collect();
    const customerCount = customers.length;

    // Count active staff and clients (excluding soft-deleted users)
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", userRecord.orgId!))
      .collect();

    const activeUsers = users.filter((u) => !u.deletedAt);
    const staffCount = activeUsers.filter((u) => u.role === "staff").length;
    const clientCount = activeUsers.filter((u) => u.role === "client").length;

    // Count pending invitations by role
    const pendingInvitations = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_org", (q) => q.eq("orgId", userRecord.orgId!))
      .collect();

    const pendingStaffCount = pendingInvitations.filter((i) => i.role === "staff").length;
    const pendingClientCount = pendingInvitations.filter((i) => i.role === "client").length;

    return {
      plan: {
        name: getPlanName(org.planId),
        status: org.subscriptionStatus || "inactive",
        planId: org.planId,
      },
      usage: {
        customers: {
          count: customerCount,
          max: org.maxCustomers,
        },
        staff: {
          count: staffCount + pendingStaffCount,
          max: org.maxStaff,
        },
        clients: {
          count: clientCount + pendingClientCount,
          max: org.maxClients,
        },
      },
    };
  },
});

/**
 * Get billing information for the current organization
 * Admin-only query that returns subscription details and trial status
 */
export const getBillingInfo = query({
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Find user record and verify admin role
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord || !userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    if (userRecord.role !== "admin") {
      throw new ConvexError("Admin role required to access billing information");
    }

    // Get org details
    const org = await ctx.db.get(userRecord.orgId);
    if (!org) {
      throw new ConvexError("Organization not found");
    }

    // Compute trial status
    const now = Date.now();
    const isTrialing = org.subscriptionStatus === "active" &&
                       !!org.trialEndsAt &&
                       org.trialEndsAt > now;

    let trialDaysRemaining: number | null = null;
    if (isTrialing && org.trialEndsAt) {
      const msRemaining = org.trialEndsAt - now;
      trialDaysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    }

    return {
      name: org.name,
      workosOrgId: org.workosOrgId,
      subscriptionId: org.subscriptionId,
      subscriptionStatus: org.subscriptionStatus,
      planId: org.planId,
      trialEndsAt: org.trialEndsAt,
      endsAt: org.endsAt,
      isTrialing,
      trialDaysRemaining,
    };
  },
});
