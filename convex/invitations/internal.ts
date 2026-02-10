import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

const pendingInvitationSummary = v.object({
  _id: v.id("pendingInvitations"),
  expiresAt: v.number(),
});

/**
 * Internal query to get pending invitation by ID
 */
export const getPendingInvitation = internalQuery({
  args: {
    invitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("pendingInvitations", args.invitationId);
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
    await ctx.db.delete("pendingInvitations", args.invitationId);
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
    await ctx.db.patch("pendingInvitations", args.invitationId, {
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
    const customer = await ctx.db.get("customers", args.customerId);

    if (!customer || customer.orgId !== args.orgId) {
      return null;
    }

    return customer;
  },
});

/**
 * Internal query to get pending invitation by WorkOS invitation ID
 */
export const getPendingInvitationByWorkosId = internalQuery({
  args: {
    workosInvitationId: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_workos_id", (q) => q.eq("workosInvitationId", args.workosInvitationId))
      .first();

    return invitation;
  },
});

/**
 * Internal query to check if an org member exists by email (case-insensitive)
 */
export const isOrgMemberByEmail = internalQuery({
  args: {
    orgId: v.id("orgs"),
    email: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return users.some(
      (user) => !user.deletedAt && user.email.toLowerCase() === normalizedEmail
    );
  },
});

/**
 * Internal query to get a pending invitation by email (case-insensitive)
 */
export const getPendingInvitationByEmail = internalQuery({
  args: {
    orgId: v.id("orgs"),
    email: v.string(),
  },
  returns: v.union(v.null(), pendingInvitationSummary),
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    
    // Use by_email_org index for efficient lookup
    const invitation = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_email_org", (q) => 
        q.eq("email", normalizedEmail).eq("orgId", args.orgId)
      )
      .first();

    if (!invitation) {
      return null;
    }

    return {
      _id: invitation._id,
      expiresAt: invitation.expiresAt,
    };
  },
});

/**
 * Internal query to find the most recent pending invitation by email (case-insensitive)
 * across all organizations. Used as a fallback when WorkOS membership data isn't available.
 */
export const getPendingInvitationByEmailGlobal = internalQuery({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("pendingInvitations"),
      workosInvitationId: v.string(),
      orgId: v.id("orgs"),
      role: v.union(v.literal("staff"), v.literal("client")),
      customerId: v.optional(v.id("customers")),
      createdAt: v.number(),
      expiresAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const invitations = await ctx.db.query("pendingInvitations").collect();

    const now = Date.now();
    const matches = invitations.filter(
      (pending) =>
        pending.email.toLowerCase() === normalizedEmail && pending.expiresAt > now
    );

    if (matches.length === 0) {
      return null;
    }

    matches.sort((a, b) => b.createdAt - a.createdAt);
    const invitation = matches[0];

    return {
      _id: invitation._id,
      workosInvitationId: invitation.workosInvitationId,
      orgId: invitation.orgId,
      role: invitation.role,
      customerId: invitation.customerId,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
    };
  },
});

/**
 * Internal query to get pending invitation details by email (case-insensitive)
 * Used when syncing invited users who accepted their WorkOS invitation
 */
export const getPendingInvitationDetailsByEmail = internalQuery({
  args: {
    orgId: v.id("orgs"),
    email: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("pendingInvitations"),
      workosInvitationId: v.string(),
      role: v.union(v.literal("staff"), v.literal("client")),
      customerId: v.optional(v.id("customers")),
      expiresAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const invitations = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const invitation = invitations.find(
      (pending) => pending.email.toLowerCase() === normalizedEmail
    );

    if (!invitation) {
      return null;
    }

    return {
      _id: invitation._id,
      workosInvitationId: invitation.workosInvitationId,
      role: invitation.role,
      customerId: invitation.customerId,
      expiresAt: invitation.expiresAt,
    };
  },
});
