import { ConvexError, v } from "convex/values";
import { action, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { processWorkOSWebhook, signWorkOSWebhook } from "./webhooks/workosShared";
import type { Id } from "./_generated/dataModel";

function isTestApiKey(apiKey?: string): boolean {
  return !!apiKey && apiKey.startsWith("sk_test_");
}

function randomId(prefix: string): string {
  if (typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const getStatus = query({
  args: {},
  returns: v.object({
    convex: v.object({
      connected: v.boolean(),
      deployment: v.optional(v.string()),
    }),
    workos: v.object({
      clientIdSet: v.boolean(),
      apiKeySet: v.boolean(),
      webhookSecretSet: v.boolean(),
      apiKeyIsTest: v.optional(v.boolean()),
    }),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", identity.subject))
      .first();

    if (!userRecord || userRecord.role !== "admin") {
      throw new ConvexError("Admin role required");
    }

    const apiKey = process.env.WORKOS_API_KEY;
    const clientId = process.env.WORKOS_CLIENT_ID;
    const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;

    return {
      convex: {
        connected: true,
        deployment: process.env.CONVEX_DEPLOYMENT,
      },
      workos: {
        clientIdSet: !!clientId,
        apiKeySet: !!apiKey,
        webhookSecretSet: !!webhookSecret,
        apiKeyIsTest: apiKey ? isTestApiKey(apiKey) : undefined,
      },
    };
  },
});

export const simulateWorkOSWebhook = action({
  args: {
    email: v.string(),
    role: v.union(v.literal("staff"), v.literal("client")),
    customerId: v.optional(v.id("customers")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    status: v.number(),
    message: v.string(),
    event: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    invitationId: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const userRecord = await ctx.runQuery(internal.invitations.internal.getUserRecord, {
      workosUserId: identity.subject,
    });

    if (!userRecord || userRecord.role !== "admin") {
      throw new ConvexError("Admin role required");
    }

    if (!userRecord.orgId) {
      throw new ConvexError("User not in organization");
    }

    if (args.role === "client" && !args.customerId) {
      throw new ConvexError("Customer ID required for client invitations");
    }

    if (args.role === "client" && args.customerId) {
      const customer = await ctx.runQuery(internal.invitations.internal.getCustomer, {
        customerId: args.customerId,
        orgId: userRecord.orgId,
      });

      if (!customer) {
        throw new ConvexError("Customer not found or does not belong to your organization");
      }
    }

    const org = await ctx.runQuery(internal.orgs.get.getMyOrgInternal, {
      workosUserId: identity.subject,
    });

    if (!org?.workosOrgId) {
      throw new ConvexError("Organization not configured with WorkOS");
    }

    const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ConvexError("WORKOS_WEBHOOK_SECRET not configured");
    }

    const apiKey = process.env.WORKOS_API_KEY;
    if (apiKey && !isTestApiKey(apiKey)) {
      throw new ConvexError("Webhook simulator requires a WorkOS test API key");
    }

    const invitationId = randomId("invitation");
    const workosUserId = randomId("user");
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const expiresIso = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

    await ctx.runMutation(internal.invitations.internal.storePendingInvitation, {
      workosInvitationId: invitationId,
      email: args.email,
      orgId: userRecord.orgId,
      role: args.role,
      customerId: args.customerId,
      inviterUserId: userRecord._id,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    });

    const eventPayload = {
      id: randomId("evt"),
      event: "invitation.accepted",
      created_at: nowIso,
      data: {
        object: "invitation",
        id: invitationId,
        state: "accepted",
        accepted_at: nowIso,
        revoked_at: null,
        expires_at: expiresIso,
        organization_id: org.workosOrgId,
        inviter_user_id: identity.subject,
        accepted_user_id: workosUserId,
        email: args.email,
        created_at: nowIso,
        updated_at: nowIso,
      },
    };

    const body = JSON.stringify(eventPayload);
    const signature = await signWorkOSWebhook(body, webhookSecret);

    const result = await processWorkOSWebhook(ctx, body, signature, webhookSecret);

    return {
      ok: result.ok,
      status: result.status,
      message: result.message,
      event: result.event,
      userId: result.userId,
      invitationId,
    };
  },
});
