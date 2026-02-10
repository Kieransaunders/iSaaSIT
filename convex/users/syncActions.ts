"use node";

import { WorkOS } from "@workos-inc/node";
import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";

type AppRole = "admin" | "staff" | "client";

const normalizeRole = (role: unknown): AppRole | undefined => {
  if (!role) {
    return undefined;
  }

  if (typeof role === "string") {
    if (role === "admin" || role === "staff" || role === "client") {
      return role;
    }
    if (role === "member") {
      return "staff";
    }
    return undefined;
  }

  if (typeof role === "object") {
    const slug = (role as { slug?: string; name?: string }).slug ?? (role as { name?: string }).name;
    return normalizeRole(slug ?? undefined);
  }

  return undefined;
};

/**
 * Return type for syncCurrentUserFromWorkOS action
 */
const syncResult = v.object({
  synced: v.boolean(),
  hasOrg: v.boolean(),
  orgId: v.optional(v.id("orgs")),
  role: v.optional(v.union(v.literal("admin"), v.literal("staff"), v.literal("client"))),
});

type SyncResult = {
  synced: boolean;
  hasOrg: boolean;
  orgId?: Id<"orgs">;
  role?: "admin" | "staff" | "client";
};

/**
 * Sync current user from WorkOS on login.
 * Falls back to pending invitation data when webhook wasn't delivered.
 */
export const syncCurrentUserFromWorkOS = action({
  args: {},
  returns: syncResult,
  handler: async (ctx): Promise<SyncResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = identity.subject;
    const email = identity.email ?? "";
    const firstName = typeof identity.given_name === "string" ? identity.given_name : undefined;
    const lastName = typeof identity.family_name === "string" ? identity.family_name : undefined;

    const existing = await ctx.runQuery(internal.users.internal.getUserByWorkosId, {
      workosUserId,
    });

    let orgId: Id<"orgs"> | undefined = existing?.orgId ?? undefined;
    let role: AppRole | undefined = existing?.role ?? undefined;
    let customerId: Id<"customers"> | undefined;
    let pendingInvitationId: Id<"pendingInvitations"> | undefined;

    // If the user is already linked to an org, still reconcile any pending invite
    // for this email/org (for example after re-invite flows).
    if (orgId && email) {
      const pending = await ctx.runQuery(
        internal.invitations.internal.getPendingInvitationDetailsByEmail,
        { orgId, email }
      );

      if (pending) {
        role = pending.role;
        customerId = pending.customerId ?? undefined;
        pendingInvitationId = pending._id;
      }
    }

    if (!orgId && process.env.WORKOS_API_KEY) {
      try {
        const workos = new WorkOS(process.env.WORKOS_API_KEY);
        console.log(`[Sync] Checking memberships for WorkOS user: ${workosUserId}`);

        const memberships = await workos.userManagement.listOrganizationMemberships({
          userId: workosUserId,
          statuses: ["active", "pending"],
          limit: 25,
        });

        console.log(`[Sync] Found ${memberships.data.length} memberships`);

        for (const membership of memberships.data) {
          if (membership.status === "inactive") {
            continue;
          }

          console.log(`[Sync] Checking membership for org: ${membership.organizationId} (Status: ${membership.status})`);

          const org = await ctx.runQuery(internal.orgs.get.getOrgByWorkosOrgId, {
            workosOrgId: membership.organizationId,
          });

          if (!org) {
            console.log(`[Sync] Org not found in Convex for WorkOS org: ${membership.organizationId}`);
            continue;
          }

          let pending = null;
          if (email) {
            pending = await ctx.runQuery(
              internal.invitations.internal.getPendingInvitationDetailsByEmail,
              { orgId: org._id, email }
            );
          }

          if (pending) {
            console.log(`[Sync] Found pending invitation for email: ${email} in org: ${org.name}`);
            orgId = org._id;
            role = pending.role;
            customerId = pending.customerId ?? undefined;
            pendingInvitationId = pending._id;
            break;
          }

          if (!orgId) {
            console.log(`[Sync] Falling back to WorkOS role mapping for org: ${org.name}`);
            orgId = org._id;
            role = normalizeRole(membership.role) ?? role;
          }
        }
      } catch (error) {
        console.error("WorkOS membership sync failed:", error);
      }
    }

    if (!orgId && email) {
      console.log(`[Sync] No org found via memberships, checking global invitations for email: ${email}`);
      const pending: {
        _id: Id<"pendingInvitations">;
        workosInvitationId: string;
        orgId: Id<"orgs">;
        role: "staff" | "client";
        customerId?: Id<"customers">;
        createdAt: number;
        expiresAt: number;
      } | null = await ctx.runQuery(
        internal.invitations.internal.getPendingInvitationByEmailGlobal,
        { email }
      );

      if (pending) {
        console.log(`[Sync] Found global invitation for email: ${email}, org: ${pending.orgId}`);
        const org: Doc<"orgs"> | null = await ctx.runQuery(internal.orgs.get.getOrgByIdInternal, {
          orgId: pending.orgId,
        });

        if (org) {
          console.log(`[Sync] Mapping user to org: ${org.name} via global invite`);
          orgId = org._id;
          role = pending.role;
          customerId = pending.customerId ?? undefined;
          pendingInvitationId = pending._id;

          if (process.env.WORKOS_API_KEY) {
            try {
              const workos = new WorkOS(process.env.WORKOS_API_KEY);
              // Global invitations only support "staff" or "client" roles
              // Map to WorkOS roles: "staff" -> "member", "client" -> "member"
              const roleSlug = "member";
              console.log(`[Sync] Creating WorkOS membership for org: ${org.workosOrgId} with role: ${roleSlug}`);
              await workos.userManagement.createOrganizationMembership({
                userId: workosUserId,
                organizationId: org.workosOrgId,
                roleSlug,
              });
            } catch (error) {
              // Ignore conflicts if membership already exists
              console.error("WorkOS membership creation failed during global sync:", error);
            }
          }
        } else {
          console.log(`[Sync] Global invite found but org ${pending.orgId} no longer exists`);
        }
      } else {
        console.log(`[Sync] No global invitation found for email: ${email}`);
      }
    }

    if (!role && orgId) {
      role = "staff";
    }

    await ctx.runMutation(internal.users.sync.upsertFromAuth, {
      workosUserId,
      email,
      firstName,
      lastName,
      orgId,
      role,
      customerId,
      reactivateIfDeleted: !!(existing?.deletedAt && pendingInvitationId),
    });

    if (pendingInvitationId) {
      await ctx.runMutation(internal.invitations.internal.deletePendingInvitation, {
        invitationId: pendingInvitationId,
      });
    }

    return {
      synced: true,
      hasOrg: !!orgId,
      orgId,
      role,
    };
  },
});
