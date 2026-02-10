# Phase 3 Verification Checklist (Starter Kit)

Use this checklist to verify the Lemon Squeezy billing flow when billing is enabled. If billing is intentionally skipped for a starter kit project, mark the checklist as deferred and keep Phase 3 In Progress.

- [ ] Convex billing env vars are set: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `LEMONSQUEEZY_PRO_VARIANT_ID`, `LEMONSQUEEZY_BUSINESS_VARIANT_ID`
- [ ] App env vars are set: `VITE_LEMONSQUEEZY_STORE_SLUG`, `VITE_LEMONSQUEEZY_PRO_VARIANT_ID`, `VITE_LEMONSQUEEZY_BUSINESS_VARIANT_ID`
- [ ] Lemon Squeezy webhook points to `https://<deployment>.convex.site/lemonsqueezy/webhook`
- [ ] Tools page shows Billing plan mapping as Ready
- [ ] Billing page opens Lemon Squeezy checkout overlay for Pro/Business (prefilled email and org name)
- [ ] Test checkout completes and org plan status updates to Active with new limits
- [ ] Cancel subscription updates org status to Cancelled and shows endsAt date
- [ ] Manage Subscription and View Invoices open the customer portal
- [ ] Invite staff/client at limit shows CapReachedBanner and disables submit
- [ ] 80%+ usage shows the warning banner in authenticated layout

Last updated: 2026-02-10
