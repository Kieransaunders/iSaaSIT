import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * List all customers for the current user's org
 * Respects role-based access (Admin sees all, Staff sees assigned, Client sees own)
 */
export const listCustomers = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const workosUserId = user.subject;

    // Get user record with role and org
    const userRecord = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) => q.eq("workosUserId", workosUserId))
      .first();

    if (!userRecord?.orgId) {
      throw new ConvexError("User not associated with an organization");
    }

    const orgId = userRecord.orgId;
    const role = userRecord.role;

    // Role-based data scoping
    if (role === "admin") {
      // Admin sees all customers in org
      const customers = await ctx.db
        .query("customers")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
      return customers;
    } else if (role === "staff") {
      // Staff sees only assigned customers
      const assignments = await ctx.db
        .query("staffCustomerAssignments")
        .withIndex("by_staff", (q) => q.eq("staffUserId", userRecord._id))
        .collect();

      const customerIds = assignments.map((a) => a.customerId);
      const customers = await Promise.all(
        customerIds.map((id) => ctx.db.get(id))
      );
      return customers.filter((c): c is NonNullable<typeof c> => c !== null);
    } else if (role === "client") {
      // Client sees only their own customer
      if (!userRecord.customerId) {
        return [];
      }
      const customer = await ctx.db.get(userRecord.customerId);
      return customer ? [customer] : [];
    }

    return [];
  },
});

/**
 * Get a single customer by ID
 * Checks user has access to this customer
 */
export const getCustomer = query({
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

    // Get the customer
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new ConvexError("Customer not found");
    }

    // Verify customer belongs to user's org
    if (customer.orgId !== userRecord.orgId) {
      throw new ConvexError("Access denied");
    }

    // Role-based access check
    const role = userRecord.role;
    if (role === "staff") {
      // Check if staff is assigned to this customer
      const assignment = await ctx.db
        .query("staffCustomerAssignments")
        .withIndex("by_staff_customer", (q) =>
          q.eq("staffUserId", userRecord._id).eq("customerId", args.customerId)
        )
        .first();
      if (!assignment) {
        throw new ConvexError("Access denied - not assigned to this customer");
      }
    } else if (role === "client") {
      // Client can only access their own customer
      if (userRecord.customerId !== args.customerId) {
        throw new ConvexError("Access denied");
      }
    }

    return customer;
  },
});

/**
 * Create a new customer
 * Enforces maxCustomers limit from org's plan
 */
export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
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

    // Check permission (only admin and staff can create customers)
    const role = userRecord.role;
    if (role !== "admin" && role !== "staff") {
      throw new ConvexError("Permission denied");
    }

    const orgId = userRecord.orgId;

    // Get org to check limits
    const org = await ctx.db.get(orgId);
    if (!org) {
      throw new ConvexError("Organization not found");
    }

    // Count existing customers
    const existingCustomers = await ctx.db
      .query("customers")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Enforce usage limit
    if (existingCustomers.length >= org.maxCustomers) {
      throw new ConvexError(
        `Customer limit reached. Maximum ${org.maxCustomers} customers allowed on your plan. Upgrade to add more.`
      );
    }

    // Create the customer
    const now = Date.now();
    const customerId = await ctx.db.insert("customers", {
      orgId,
      name: args.name,
      email: args.email,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    // If staff created the customer, auto-assign them to it
    if (role === "staff") {
      await ctx.db.insert("staffCustomerAssignments", {
        staffUserId: userRecord._id,
        customerId,
        orgId,
        createdAt: now,
      });
    }

    return customerId;
  },
});

/**
 * Update a customer
 */
export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
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

    // Get the customer
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new ConvexError("Customer not found");
    }

    // Verify customer belongs to user's org
    if (customer.orgId !== userRecord.orgId) {
      throw new ConvexError("Access denied");
    }

    // Check permissions
    const role = userRecord.role;
    if (role === "client") {
      throw new ConvexError("Clients cannot update customer details");
    }

    if (role === "staff") {
      // Check if staff is assigned to this customer
      const assignment = await ctx.db
        .query("staffCustomerAssignments")
        .withIndex("by_staff_customer", (q) =>
          q.eq("staffUserId", userRecord._id).eq("customerId", args.customerId)
        )
        .first();
      if (!assignment) {
        throw new ConvexError("Access denied - not assigned to this customer");
      }
    }

    // Update the customer
    const updateData: Partial<typeof customer> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.notes !== undefined) updateData.notes = args.notes;

    await ctx.db.patch(args.customerId, updateData);

    return args.customerId;
  },
});

/**
 * Delete a customer
 * Only admins can delete
 */
export const deleteCustomer = mutation({
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

    // Only admins can delete customers
    if (userRecord.role !== "admin") {
      throw new ConvexError("Only admins can delete customers");
    }

    // Get the customer
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new ConvexError("Customer not found");
    }

    // Verify customer belongs to user's org
    if (customer.orgId !== userRecord.orgId) {
      throw new ConvexError("Access denied");
    }

    // Delete the customer
    await ctx.db.delete(args.customerId);

    // Clean up staff assignments
    const assignments = await ctx.db
      .query("staffCustomerAssignments")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    return args.customerId;
  },
});

/**
 * Get customer count and limit info for the org
 */
export const getCustomerUsage = query({
  handler: async (ctx) => {
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

    if (!userRecord.orgId) {
      throw new ConvexError("User not associated with an organization");
    }

    // Get org limits
    const org = await ctx.db.get(userRecord.orgId);
    if (!org) {
      throw new ConvexError("Organization not found");
    }

    const orgId = userRecord.orgId;

    // Count customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    return {
      count: customers.length,
      max: org.maxCustomers,
      remaining: Math.max(0, org.maxCustomers - customers.length),
      atLimit: customers.length >= org.maxCustomers,
    };
  },
});
