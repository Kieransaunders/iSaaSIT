"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { WorkOS } from "@workos-inc/node";
import { v, ConvexError } from "convex/values";

/**
 * Send an invitation to join the organization via WorkOS
 */
export const sendInvitation = action({
  args: {
    email: v.string(),
    role: v.union(v.literal("staff"), v.literal("client")),
    customerId: v.optional(v.id("customers")),
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
      throw new ConvexError("Admin role required to send invitations");
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

    // Validate: if role is client, customerId MUST be provided
    if (args.role === "client" && !args.customerId) {
      throw new ConvexError("Customer ID required for client invitations");
    }

    // Check usage caps before sending
    const counts = await ctx.runQuery(internal.invitations.internal.getOrgUserCounts, {
      orgId: userRecord.orgId,
    });

    if (args.role === "staff") {
      if (counts.staffCount + counts.pendingStaffCount >= org.maxStaff) {
        throw new ConvexError(
          `Staff limit reached (${org.maxStaff}). Upgrade your plan to invite more staff members.`
        );
      }
    } else if (args.role === "client") {
      if (counts.clientCount + counts.pendingClientCount >= org.maxClients) {
        throw new ConvexError(
          `Client limit reached (${org.maxClients}). Upgrade your plan to invite more clients.`
        );
      }
    }

    // If client role, verify customer exists
    if (args.role === "client" && args.customerId) {
      const customer = await ctx.runQuery(internal.invitations.internal.getCustomer, {
        customerId: args.customerId,
        orgId: userRecord.orgId,
      });

      if (!customer) {
        throw new ConvexError("Customer not found or does not belong to your organization");
      }
    }

    try {
      // Initialize WorkOS client
      const workos = new WorkOS(process.env.WORKOS_API_KEY);

      // Send invitation via WorkOS
      const invitation = await workos.userManagement.sendInvitation({
        organizationId: org.workosOrgId,
        email: args.email,
        expiresInDays: 7,
        inviterUserId: workosUserId,
      });

      // Store pending invitation in Convex
      const now = Date.now();
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

      await ctx.runMutation(internal.invitations.internal.storePendingInvitation, {
        workosInvitationId: invitation.id,
        email: args.email,
        orgId: userRecord.orgId,
        role: args.role,
        customerId: args.customerId,
        inviterUserId: userRecord._id,
        createdAt: now,
        expiresAt,
      });

      return { invitationId: invitation.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ConvexError(`Failed to send invitation: ${message}`);
    }
  },
});
