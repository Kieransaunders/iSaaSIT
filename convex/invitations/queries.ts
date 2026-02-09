import { query } from "../_generated/server";
import { ConvexError } from "convex/values";

/**
 * List all pending invitations for the current user's organization
 */
export const listPendingInvitations = query({
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;

    // Get user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord) {
      throw new ConvexError("User record not found");
    }

    // Verify admin role
    if (userRecord.role !== "admin") {
      throw new ConvexError("Admin role required to view invitations");
    }

    if (!userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    const orgId = userRecord.orgId;

    // Query pending invitations for this org
    const invitations = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Enrich with customer name if customerId is present
    const enrichedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        let customerName: string | undefined = undefined;

        if (invitation.customerId) {
          const customer = await ctx.db.get(invitation.customerId);
          customerName = customer?.name;
        }

        return {
          ...invitation,
          customerName,
        };
      })
    );

    return enrichedInvitations;
  },
});
