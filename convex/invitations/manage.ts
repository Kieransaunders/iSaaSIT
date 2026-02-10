"use node";

import { WorkOS } from "@workos-inc/node";
import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

function getWorkOSErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
  };

  const values = [candidate.status, candidate.statusCode, candidate.response?.status];

  for (const value of values) {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && /^\d{3}$/.test(value)) {
      return Number(value);
    }
  }

  return undefined;
}

function isInvitationTerminalStateError(error: unknown): boolean {
  const status = getWorkOSErrorStatus(error);
  if (status === 400 || status === 404 || status === 409 || status === 422) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("accepted") ||
    message.includes("revoked") ||
    message.includes("expired") ||
    message.includes("not found") ||
    message.includes("not pending")
  );
}

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

    const isExistingMember = await ctx.runQuery(internal.invitations.internal.isOrgMemberByEmail, {
      orgId: userRecord.orgId,
      email: invitation.email,
    });

    if (isExistingMember) {
      await ctx.runMutation(internal.invitations.internal.deletePendingInvitation, {
        invitationId: args.invitationId,
      });
      return { success: true, cleanedUp: true };
    }

    try {
      // Initialize WorkOS client
      const workos = new WorkOS(process.env.WORKOS_API_KEY);

      let requiresRevoke = true;
      try {
        const workosInvitation = await workos.userManagement.getInvitation(invitation.workosInvitationId);
        requiresRevoke = workosInvitation.state === "pending";
      } catch (error) {
        // If the invite no longer exists or is in a terminal state, local cleanup is sufficient.
        if (!isInvitationTerminalStateError(error)) {
          throw error;
        }
        requiresRevoke = false;
      }

      if (requiresRevoke) {
        try {
          await workos.userManagement.revokeInvitation(invitation.workosInvitationId);
        } catch (error) {
          // Accepted/expired/revoked/not-found invites should still be removable from local pending list.
          if (!isInvitationTerminalStateError(error)) {
            throw error;
          }
        }
      }

      // Delete the pending invitation from Convex
      await ctx.runMutation(internal.invitations.internal.deletePendingInvitation, {
        invitationId: args.invitationId,
      });

      return { success: true, cleanedUp: false };
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

    const isExistingMember = await ctx.runQuery(internal.invitations.internal.isOrgMemberByEmail, {
      orgId: userRecord.orgId,
      email: invitation.email,
    });

    if (isExistingMember) {
      await ctx.runMutation(internal.invitations.internal.deletePendingInvitation, {
        invitationId: args.invitationId,
      });
      return { success: true, resent: false, cleanedUp: true };
    }

    // Check usage caps before resending
    const counts = await ctx.runQuery(internal.invitations.internal.getOrgUserCounts, {
      orgId: userRecord.orgId,
    });

    if (invitation.role === "staff") {
      // Subtract 1 because we're replacing the existing pending invitation
      if (counts.staffCount + counts.pendingStaffCount - 1 >= org.maxStaff) {
        throw new ConvexError(
          `Staff limit reached (${org.maxStaff}). Upgrade your plan to invite more staff members.`
        );
      }
    } else if (invitation.role === "client") {
      // Subtract 1 because we're replacing the existing pending invitation
      if (counts.clientCount + counts.pendingClientCount - 1 >= org.maxClients) {
        throw new ConvexError(
          `Client limit reached (${org.maxClients}). Upgrade your plan to invite more clients.`
        );
      }
    }

    try {
      // Initialize WorkOS client
      const workos = new WorkOS(process.env.WORKOS_API_KEY);

      let requiresRevoke = true;
      try {
        const workosInvitation = await workos.userManagement.getInvitation(invitation.workosInvitationId);
        requiresRevoke = workosInvitation.state === "pending";
      } catch (error) {
        // Missing/terminal invitation in WorkOS is fine; we'll still attempt a fresh invite.
        if (!isInvitationTerminalStateError(error)) {
          throw error;
        }
        requiresRevoke = false;
      }

      if (requiresRevoke) {
        try {
          await workos.userManagement.revokeInvitation(invitation.workosInvitationId);
        } catch (error) {
          if (!isInvitationTerminalStateError(error)) {
            throw error;
          }
        }
      }

      // Send a new invitation
      let newInvitation;
      try {
        newInvitation = await workos.userManagement.sendInvitation({
          organizationId: org.workosOrgId,
          email: invitation.email,
          expiresInDays: 7,
          inviterUserId: workosUserId,
        });
      } catch (error) {
        const status = getWorkOSErrorStatus(error);
        const message = error instanceof Error ? error.message.toLowerCase() : "";

        // User already joined or cannot be re-invited in current state -> local row is stale.
        if (status === 409 || status === 422 || message.includes("already a member")) {
          await ctx.runMutation(internal.invitations.internal.deletePendingInvitation, {
            invitationId: args.invitationId,
          });
          return { success: true, resent: false, cleanedUp: true };
        }

        throw error;
      }

      // Update the Convex record with new workosInvitationId and expiresAt
      const now = Date.now();
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

      await ctx.runMutation(internal.invitations.internal.updatePendingInvitation, {
        invitationId: args.invitationId,
        workosInvitationId: newInvitation.id,
        expiresAt,
      });

      return { success: true, resent: true, cleanedUp: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ConvexError(`Failed to resend invitation: ${message}`);
    }
  },
});
