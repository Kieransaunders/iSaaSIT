/**
 * Lemon Squeezy Plan Tier Configuration
 *
 * Maps variant IDs to plan limits for subscription tiers.
 *
 * SETUP REQUIRED: Replace placeholder variant IDs with actual values from your
 * Lemon Squeezy dashboard after creating your products/variants.
 *
 * Location: Lemon Squeezy Dashboard -> Products -> [Your Product] -> Variants
 */

export const FREE_TIER_LIMITS = {
  maxCustomers: 3,
  maxStaff: 2,
  maxClients: 10,
} as const;

/**
 * Plan tier definitions with variant ID mappings
 *
 * TODO: Update variant IDs after creating products in Lemon Squeezy dashboard
 */
export const PLAN_TIERS = {
  // Pro Plan - Small agencies
  "VARIANT_PRO": {
    name: "Pro",
    maxCustomers: 25,
    maxStaff: 10,
    maxClients: 100,
  },

  // Business Plan - Growing agencies
  "VARIANT_BUSINESS": {
    name: "Business",
    maxCustomers: 100,
    maxStaff: 50,
    maxClients: 500,
  },
} as const;

/**
 * Get plan limits for a given Lemon Squeezy variant ID
 *
 * @param variantId - Lemon Squeezy variant ID from subscription data
 * @returns Plan limits object (defaults to FREE_TIER_LIMITS for unknown variants)
 */
export function getLimitsForVariant(variantId: string): {
  maxCustomers: number;
  maxStaff: number;
  maxClients: number;
} {
  const plan = PLAN_TIERS[variantId as keyof typeof PLAN_TIERS];

  if (!plan) {
    // Unknown variant ID - default to free tier
    return FREE_TIER_LIMITS;
  }

  return {
    maxCustomers: plan.maxCustomers,
    maxStaff: plan.maxStaff,
    maxClients: plan.maxClients,
  };
}

/**
 * Get display name for a plan variant
 *
 * @param variantId - Lemon Squeezy variant ID (optional)
 * @returns Plan name ("Free", "Pro", or "Business")
 */
export function getPlanName(variantId: string | undefined): string {
  if (!variantId) {
    return "Free";
  }

  const plan = PLAN_TIERS[variantId as keyof typeof PLAN_TIERS];
  return plan?.name ?? "Free";
}
