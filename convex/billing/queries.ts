import { ConvexError } from 'convex/values';
import { query } from '../_generated/server';
import { polar } from '../polar';
import { getLimitsForSubscription, getPlanName } from './plans';

/**
 * Get usage statistics for the current organization
 * Returns counts of customers, staff, and clients against plan limits
 */
export const getUsageStats = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('Not authenticated');
    }

    const workosUserId = identity.subject;

    // Find user record
    const userRecord = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', workosUserId))
      .first();

    if (!userRecord || !userRecord.orgId) {
      throw new ConvexError('User not in organization');
    }

    // Get org details for context
    const org = await ctx.db.get('orgs', userRecord.orgId);
    if (!org) {
      throw new ConvexError('Organization not found');
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: userRecord._id,
    });

    const subscriptionStatus = subscription?.status ?? 'inactive';
    const productKey = subscription?.productKey;
    const limits = getLimitsForSubscription({
      status: subscriptionStatus,
      productKey,
    });

    // Count customers
    const customers = await ctx.db
      .query('customers')
      .withIndex('by_org', (q) => q.eq('orgId', userRecord.orgId!))
      .collect();
    const customerCount = customers.length;

    // Count active staff and clients (excluding soft-deleted users)
    const users = await ctx.db
      .query('users')
      .withIndex('by_org', (q) => q.eq('orgId', userRecord.orgId))
      .collect();

    const activeUsers = users.filter((u) => !u.deletedAt);
    const staffCount = activeUsers.filter((u) => u.role === 'staff').length;
    const clientCount = activeUsers.filter((u) => u.role === 'client').length;

    // Count pending invitations by role
    const pendingInvitations = await ctx.db
      .query('pendingInvitations')
      .withIndex('by_org', (q) => q.eq('orgId', userRecord.orgId!))
      .collect();

    const pendingStaffCount = pendingInvitations.filter((i) => i.role === 'staff').length;
    const pendingClientCount = pendingInvitations.filter((i) => i.role === 'client').length;

    return {
      plan: {
        name: getPlanName(productKey),
        status: subscriptionStatus,
        planId: productKey ?? 'free',
      },
      usage: {
        customers: {
          count: customerCount,
          max: limits.maxCustomers,
        },
        staff: {
          count: staffCount + pendingStaffCount,
          max: limits.maxStaff,
        },
        clients: {
          count: clientCount + pendingClientCount,
          max: limits.maxClients,
        },
      },
    };
  },
});

/**
 * Get billing information for the current organization
 * Admin-only query that returns subscription details and trial status
 */
export const getBillingInfo = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('Not authenticated');
    }

    const workosUserId = identity.subject;

    // Find user record and verify admin role
    const userRecord = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', workosUserId))
      .first();

    if (!userRecord || !userRecord.orgId) {
      throw new ConvexError('User not in organization');
    }

    if (userRecord.role !== 'admin') {
      throw new ConvexError('Admin role required to access billing information');
    }

    const org = await ctx.db.get('orgs', userRecord.orgId);
    if (!org) {
      throw new ConvexError('Organization not found');
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: userRecord._id,
    });

    const now = Date.now();
    const subscriptionStatus = subscription?.status ?? 'inactive';
    const trialEndsAt =
      org.trialEndsAt ?? (subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null);
    const isTrialing = subscriptionStatus === 'trialing' && !!trialEndsAt && trialEndsAt > now;

    let trialDaysRemaining: number | null = null;
    if (isTrialing && trialEndsAt) {
      const msRemaining = trialEndsAt - now;
      trialDaysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    }

    return {
      name: org.name,
      workosOrgId: org.workosOrgId,
      subscriptionId: subscription?.id ?? null,
      subscriptionStatus,
      planId: subscription?.productKey ?? 'free',
      trialEndsAt,
      endsAt: subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null,
      isTrialing,
      trialDaysRemaining,
    };
  },
});
