import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Assign a staff user to a customer
 * Only admins can assign staff to customers
 */
export const assignStaff = mutation({
  args: {
    customerId: v.id("customers"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Get current user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      throw new ConvexError("User not associated with an organization");
    }

    // Check permission - only admin can assign staff
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
      throw new ConvexError("Access denied - customer not in your organization");
    }

    // Verify the target user exists and belongs to same org
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    if (targetUser.orgId !== orgId) {
      throw new ConvexError("Access denied - user not in your organization");
    }

    // Verify the target user has staff role
    if (targetUser.role !== "staff") {
      throw new ConvexError("Only staff users can be assigned to customers");
    }

    // Check for existing assignment to prevent duplicates
    const existingAssignment = await ctx.db
      .query("staffCustomerAssignments")
      .withIndex("by_staff_customer", (q) =>
        q.eq("staffUserId", args.userId).eq("customerId", args.customerId)
      )
      .first();

    if (existingAssignment) {
      throw new ConvexError("Staff already assigned to this customer");
    }

    // Create the assignment
    const assignmentId = await ctx.db.insert("staffCustomerAssignments", {
      staffUserId: args.userId,
      customerId: args.customerId,
      orgId,
      createdAt: Date.now(),
    });

    return assignmentId;
  },
});

/**
 * Unassign a staff user from a customer
 * Only admins can unassign staff
 */
export const unassignStaff = mutation({
  args: {
    customerId: v.id("customers"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Get current user record
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      throw new ConvexError("User not associated with an organization");
    }

    // Check permission - only admin can unassign staff
    if (userRecord.role !== "admin") {
      throw new ConvexError("Only admins can unassign staff from customers");
    }

    // Find the assignment record
    const assignment = await ctx.db
      .query("staffCustomerAssignments")
      .withIndex("by_staff_customer", (q) =>
        q.eq("staffUserId", args.userId).eq("customerId", args.customerId)
      )
      .first();

    if (!assignment) {
      throw new ConvexError("Assignment not found");
    }

    // Verify the assignment belongs to the admin's org
    if (assignment.orgId !== userRecord.orgId) {
      throw new ConvexError("Access denied");
    }

    // Delete the assignment
    await ctx.db.delete(assignment._id);

    return { success: true };
  },
});
