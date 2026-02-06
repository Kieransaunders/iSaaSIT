import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to store organization in Convex
 * Called by createOrganization action after WorkOS org is created
 */
export const storeOrg = internalMutation({
  args: {
    workosOrgId: v.string(),
    name: v.string(),
    billingEmail: v.string(),
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Insert organization
    const now = Date.now();
    const orgId = await ctx.db.insert("orgs", {
      workosOrgId: args.workosOrgId,
      name: args.name,
      billingEmail: args.billingEmail,
      subscriptionStatus: "inactive",
      planId: "free",
      // Free tier limits
      maxCustomers: 3,
      maxStaff: 2,
      maxClients: 10,
      createdAt: now,
      updatedAt: now,
    });

    // Find existing user by workosUserId
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (existingUser) {
      // Update existing user with org and admin role
      await ctx.db.patch(existingUser._id, {
        orgId,
        role: "admin",
        updatedAt: now,
      });
    } else {
      // Create new user with org and admin role
      await ctx.db.insert("users", {
        workosUserId: args.workosUserId,
        orgId,
        role: "admin",
        email: args.billingEmail, // Use billing email as default
        createdAt: now,
        updatedAt: now,
      });
    }

    return orgId;
  },
});
