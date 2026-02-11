# Phase 3 Verification Checklist (Starter Kit)

Use this checklist to verify the Polar billing flow when billing is enabled. If billing is intentionally skipped for a starter kit project, mark the checklist as deferred and keep Phase 3 In Progress.

- [ ] Convex billing env vars are set: `POLAR_ORGANIZATION_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`, `POLAR_PRO_MONTHLY_PRODUCT_ID`, `POLAR_PRO_YEARLY_PRODUCT_ID`, `POLAR_BUSINESS_MONTHLY_PRODUCT_ID`, `POLAR_BUSINESS_YEARLY_PRODUCT_ID`
- [ ] App env vars are set: `VITE_POLAR_SERVER`
- [ ] Polar webhook points to `https://<deployment>.convex.site/polar/events`
- [ ] Tools page shows Billing plan mapping as Ready
- [ ] Billing page opens Polar checkout for Pro/Business
- [ ] Test checkout completes and org plan status updates to Active with new limits
- [ ] Cancel subscription updates org status to Cancelled and shows endsAt date
- [ ] Manage Subscription and View Invoices open the customer portal
- [ ] Invite staff/client at limit shows CapReachedBanner and disables submit
- [ ] 80%+ usage shows the warning banner in authenticated layout

Last updated: 2026-02-10
