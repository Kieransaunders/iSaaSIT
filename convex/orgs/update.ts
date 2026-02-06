import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const syncOrgUpdate = internalMutation({
  args: {
    orgId: v.id("orgs"),
    name: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.billingEmail !== undefined) {
      updates.billingEmail = args.billingEmail;
    }

    await ctx.db.patch(args.orgId, updates);
  },
});
