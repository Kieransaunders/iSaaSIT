import { ConvexError } from 'convex/values';
import { Polar } from '@convex-dev/polar';
import { components, internal } from './_generated/api';

const products: Record<string, string> = {};

const proMonthlyProductId = process.env.POLAR_PRO_MONTHLY_PRODUCT_ID;
const proYearlyProductId = process.env.POLAR_PRO_YEARLY_PRODUCT_ID;
const businessMonthlyProductId = process.env.POLAR_BUSINESS_MONTHLY_PRODUCT_ID;
const businessYearlyProductId = process.env.POLAR_BUSINESS_YEARLY_PRODUCT_ID;

if (proMonthlyProductId) products.proMonthly = proMonthlyProductId;
if (proYearlyProductId) products.proYearly = proYearlyProductId;
if (businessMonthlyProductId) products.businessMonthly = businessMonthlyProductId;
if (businessYearlyProductId) products.businessYearly = businessYearlyProductId;

export const polar = new Polar(components.polar, {
  getUserInfo: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('Not authenticated');
    }

    let user = null;

    if (ctx.db) {
      user = await ctx.db
        .query('users')
        .withIndex('by_workos_user_id', (q: any) => q.eq('workosUserId', identity.subject))
        .first();
    } else if (ctx.runQuery) {
      user = await ctx.runQuery(internal.invitations.internal.getUserRecord, {
        workosUserId: identity.subject,
      });
    }

    if (!user) {
      throw new ConvexError('User record not found');
    }

    return {
      userId: user._id,
      email: user.email,
    };
  },
  products,
  organizationToken: process.env.POLAR_ORGANIZATION_TOKEN,
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
  server: process.env.POLAR_SERVER as 'sandbox' | 'production' | undefined,
});

export const {
  getCurrentSubscription,
  listUserSubscriptions,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
  cancelCurrentSubscription,
  changeCurrentSubscription,
} = polar.api();
