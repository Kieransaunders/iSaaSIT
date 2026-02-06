"use node";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { WorkOS } from "@workos-inc/node";
import { v, ConvexError } from "convex/values";

export const updateOrganization = action({
  args: {
    name: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get user's org from Convex
    const userOrg = await ctx.runQuery(internal.orgs.get.getMyOrgInternal, {
      workosUserId: identity.subject,
    });

    if (!userOrg) {
      throw new ConvexError("No organization found");
    }

    // Initialize WorkOS
    const workos = new WorkOS(process.env.WORKOS_API_KEY!);

    try {
      // Build update payload
      const updateData: any = {
        organization: userOrg.workosOrgId,
      };

      if (args.name) {
        updateData.name = args.name;
      }

      if (args.billingEmail !== undefined) {
        updateData.metadata = {
          billingEmail: args.billingEmail,
        };
      }

      // Update in WorkOS
      await workos.organizations.updateOrganization(updateData);

      // Sync to Convex
      await ctx.runMutation(internal.orgs.update.syncOrgUpdate, {
        orgId: userOrg._id,
        name: args.name,
        billingEmail: args.billingEmail,
      });

      return { success: true };
    } catch (error) {
      throw new ConvexError(
        error instanceof Error
          ? error.message
          : "Failed to update organization. Please try again."
      );
    }
  },
});
