import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal query to get pending invitation by ID
 */
export const getPendingInvitation = internalQuery({
  args: {
    invitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.invitationId);
  },
});

/**
 * Internal mutation to store pending invitation in Convex
 */
export const storePendingInvitation = internalMutation({
  args: {
    workosInvitationId: v.string(),
    email: v.string(),
    orgId: v.id("orgs"),
    role: v.union(v.literal("staff"), v.literal("client")),
    customerId: v.optional(v.id("customers")),
    inviterUserId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pendingInvitations", {
      workosInvitationId: args.workosInvitationId,
      email: args.email,
      orgId: args.orgId,
      role: args.role,
      customerId: args.customerId,
      inviterUserId: args.inviterUserId,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
    });
  },
});

/**
 * Internal mutation to delete pending invitation
 */
export const deletePendingInvitation = internalMutation({
  args: {
    invitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.invitationId);
  },
});

/**
 * Internal mutation to update pending invitation with new WorkOS ID and expiry
 */
export const updatePendingInvitation = internalMutation({
  args: {
    invitationId: v.id("pendingInvitations"),
    workosInvitationId: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.invitationId, {
      workosInvitationId: args.workosInvitationId,
      expiresAt: args.expiresAt,
    });
  },
});

/**
 * Internal query to get user record by WorkOS user ID
 */
export const getUserRecord = internalQuery({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    return userRecord;
  },
});

/**
 * Internal query to get org user counts (existing + pending)
 */
export const getOrgUserCounts = internalQuery({
  args: {
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    // Count existing users by role (excluding deleted)
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const activeUsers = users.filter((u) => !u.deletedAt);
    const staffCount = activeUsers.filter((u) => u.role === "staff").length;
    const clientCount = activeUsers.filter((u) => u.role === "client").length;

    // Count pending invitations by role
    const pendingInvitations = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const pendingStaffCount = pendingInvitations.filter((i) => i.role === "staff").length;
    const pendingClientCount = pendingInvitations.filter((i) => i.role === "client").length;

    return {
      staffCount,
      clientCount,
      pendingStaffCount,
      pendingClientCount,
    };
  },
});

/**
 * Internal query to get customer by ID and verify org ownership
 */
export const getCustomer = internalQuery({
  args: {
    customerId: v.id("customers"),
    orgId: v.id("orgs"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);

    if (!customer || customer.orgId !== args.orgId) {
      return null;
    }

    return customer;
  },
});
