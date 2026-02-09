"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { WorkOS } from "@workos-inc/node";
import { v, ConvexError } from "convex/values";

/**
 * Revoke a pending invitation
 */
export const revokeInvitation = action({
  args: {
    invitationId: v.id("pendingInvitations"),
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
      throw new ConvexError("Admin role required to revoke invitations");
    }

    if (!userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    // Get the pending invitation
    const invitation = await ctx.runQuery(internal.invitations.internal.getPendingInvitation, {
      invitationId: args.invitationId,
    });

    if (!invitation) {
      throw new ConvexError("Invitation not found");
    }

    // Verify invitation belongs to user's org
    if (invitation.orgId !== userRecord.orgId) {
      throw new ConvexError("Invitation does not belong to your organization");
    }

    try {
      // Initialize WorkOS client
      const workos = new WorkOS(process.env.WORKOS_API_KEY);

      // Revoke invitation in WorkOS
      await workos.userManagement.revokeInvitation(invitation.workosInvitationId);

      // Delete the pending invitation from Convex
      await ctx.runMutation(internal.invitations.internal.deletePendingInvitation, {
        invitationId: args.invitationId,
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ConvexError(`Failed to revoke invitation: ${message}`);
    }
  },
});

/**
 * Resend a pending invitation (revoke old + send new)
 */
export const resendInvitation = action({
  args: {
    invitationId: v.id("pendingInvitations"),
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
      throw new ConvexError("Admin role required to resend invitations");
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

    // Get the pending invitation
    const invitation = await ctx.runQuery(internal.invitations.internal.getPendingInvitation, {
      invitationId: args.invitationId,
    });

    if (!invitation) {
      throw new ConvexError("Invitation not found");
    }

    // Verify invitation belongs to user's org
    if (invitation.orgId !== userRecord.orgId) {
      throw new ConvexError("Invitation does not belong to your organization");
    }

    try {
      // Initialize WorkOS client
      const workos = new WorkOS(process.env.WORKOS_API_KEY);

      // Revoke the old invitation
      await workos.userManagement.revokeInvitation(invitation.workosInvitationId);

      // Send a new invitation
      const newInvitation = await workos.userManagement.sendInvitation({
        organizationId: org.workosOrgId,
        email: invitation.email,
        expiresInDays: 7,
        inviterUserId: workosUserId,
      });

      // Update the Convex record with new workosInvitationId and expiresAt
      const now = Date.now();
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

      await ctx.runMutation(internal.invitations.internal.updatePendingInvitation, {
        invitationId: args.invitationId,
        workosInvitationId: newInvitation.id,
        expiresAt,
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ConvexError(`Failed to resend invitation: ${message}`);
    }
  },
});
