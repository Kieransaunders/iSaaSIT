import { v } from "convex/values";
import { query } from "../_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * List staff members assigned to a customer
 * Returns staff details with assignmentId for unassign action
 */
export const listAssignedStaff = query({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Get user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      throw new ConvexError("User not associated with an organization");
    }

    // Verify user has access to this customer
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new ConvexError("Customer not found");
    }

    if (customer.orgId !== userRecord.orgId) {
      throw new ConvexError("Access denied");
    }

    // Query assignments for this customer
    const assignments = await ctx.db
      .query("staffCustomerAssignments")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    // Get staff user details for each assignment
    const staffList = await Promise.all(
      assignments.map(async (assignment) => {
        const staffUser = await ctx.db.get(assignment.staffUserId);
        if (!staffUser) {
          return null;
        }
        return {
          _id: staffUser._id,
          firstName: staffUser.firstName,
          lastName: staffUser.lastName,
          email: staffUser.email,
          assignmentId: assignment._id,
        };
      })
    );

    // Filter out null results (deleted staff)
    return staffList.filter((staff): staff is NonNullable<typeof staff> => staff !== null);
  },
});

/**
 * List available staff members that can be assigned to a customer
 * Returns staff NOT already assigned to the customer
 */
export const listAvailableStaff = query({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Get user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      throw new ConvexError("User not associated with an organization");
    }

    // Check permission - only admin can view available staff
    if (userRecord.role !== "admin") {
      throw new ConvexError("Only admins can assign staff to customers");
    }

    const orgId = userRecord.orgId;

    // Verify the customer exists and belongs to the admin's org
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new ConvexError("Customer not found");
    }

    if (customer.orgId !== orgId) {
      throw new ConvexError("Access denied");
    }

    // Get all staff users in the org
    const allStaff = await ctx.db
      .query("users")
      .withIndex("by_org_role", (q) => q.eq("orgId", orgId).eq("role", "staff"))
      .collect();

    // Filter out soft-deleted users
    const activeStaff = allStaff.filter((staff) => !staff.deletedAt);

    // Get already-assigned staff IDs for this customer
    const assignments = await ctx.db
      .query("staffCustomerAssignments")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    const assignedStaffIds = new Set(assignments.map((a) => a.staffUserId));

    // Return only staff NOT already assigned
    const availableStaff = activeStaff
      .filter((staff) => !assignedStaffIds.has(staff._id))
      .map((staff) => ({
        _id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
      }));

    return availableStaff;
  },
});
