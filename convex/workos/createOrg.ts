"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { WorkOS } from "@workos-inc/node";
import { v, ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Create a new organization in WorkOS and Convex
 * This is the single source of truth for org creation
 */
export const createOrganization = action({
  args: {
    name: v.string(),
    billingEmail: v.string(),
  },
  handler: async (ctx, args): Promise<{ orgId: Id<"orgs">; workosOrgId: string }> => {
    // Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    // Extract WorkOS user ID from identity.subject
    const workosUserId = user.subject;

    try {
      // Initialize WorkOS client
      const workos = new WorkOS(process.env.WORKOS_API_KEY);

      // Create organization in WorkOS
      const org = await workos.organizations.createOrganization({
        name: args.name,
        metadata: {
          billingEmail: args.billingEmail,
        },
      });

      // Create organization membership for current user as admin
      await workos.userManagement.createOrganizationMembership({
        userId: workosUserId,
        organizationId: org.id,
        roleSlug: "admin",
      });

      // Store org in Convex
      const convexOrgId = await ctx.runMutation(internal.workos.storeOrg.storeOrg, {
        workosOrgId: org.id,
        name: args.name,
        billingEmail: args.billingEmail,
        workosUserId: workosUserId,
      });

      return {
        orgId: convexOrgId,
        workosOrgId: org.id,
      };
    } catch (error) {
      // Re-throw with user-friendly message for retry UX
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ConvexError(
        `Failed to create organization: ${message}. Please try again.`
      );
    }
  },
});
