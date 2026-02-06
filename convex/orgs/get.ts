import { query, internalQuery } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * Get the current user's organization
 */
export const getMyOrg = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Find user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      return null;
    }

    // Get org details
    const org = await ctx.db.get(userRecord.orgId);
    if (!org) {
      return null;
    }

    return {
      ...org,
      _id: org._id,
    };
  },
});

/**
 * Get organization by ID (for admin/verification purposes)
 */
export const getOrgById = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Find user to verify they belong to this org
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      return null;
    }

    const org = await ctx.db.get(userRecord.orgId);
    return org;
  },
});

/**
 * Check if current user has an organization
 * Used to determine if user should be redirected to onboarding
 */
export const hasOrg = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return { hasOrg: false, isAuthenticated: false };
    }

    const workosUserId = user.subject;

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    return {
      hasOrg: !!userRecord?.orgId,
      isAuthenticated: true,
      role: userRecord?.role,
    };
  },
});

/**
 * Internal query to get user's org by WorkOS user ID
 * Used by actions that need org context
 */
export const getMyOrgInternal = internalQuery({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (!userRecord?.orgId) {
      return null;
    }

    const org = await ctx.db.get(userRecord.orgId);
    return org;
  },
});
