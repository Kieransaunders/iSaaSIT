import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start';
import { createServerFn } from '@tanstack/react-start';
import { fetchMutation } from 'convex/nextjs';
import { useAction, useQuery } from 'convex/react';
import { useEffect } from 'react';
import { api } from '../../convex/_generated/api';
import { MainLayout } from '@/components/layout/main-layout';
import { UsageWarningBanner } from '@/components/billing/CapReachedBanner';

// Server function to check if user has an org
const checkUserOrg = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { user } = await getAuth();
    if (!user) {
      return { hasOrg: false, isAuthenticated: false };
    }

    // Check if user has an org in Convex
    // This would ideally be a direct Convex query, but we'll handle it client-side for now
    return { hasOrg: true, isAuthenticated: true }; // Optimistic - actual check happens in loader
  });

export const Route = createFileRoute('/_authenticated')({
  loader: async ({ context }) => {
    const { user } = await getAuth();
    if (!user) {
      const href = await getSignInUrl();
      throw redirect({ href });
    }

    // For now, let the component handle org checking
    // In production, you'd want to check Convex here and redirect to /onboarding if needed
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  Route.useLoaderData();
  const navigate = useNavigate();
  const syncCurrentUser = useAction(api.users.syncActions.syncCurrentUserFromWorkOS);

  // Get usage stats for warning banner (only if user has org)
  const hasOrgCheck = useQuery(api.orgs.get.hasOrg);
  const usageStats = useQuery(
    api.billing.queries.getUsageStats,
    hasOrgCheck?.hasOrg && hasOrgCheck.role === "admin" ? {} : "skip",
  );

  useEffect(() => {
    syncCurrentUser().catch((error) => {
      console.error('Failed to sync user from WorkOS:', error);
    });
  }, [syncCurrentUser]);

  useEffect(() => {
    if (hasOrgCheck && !hasOrgCheck.hasOrg) {
      navigate({ to: '/onboarding', replace: true });
    }
  }, [hasOrgCheck, navigate]);

  return (
    <MainLayout breadcrumbs={[{ label: "Dashboard" }]}>
      {usageStats && <UsageWarningBanner usage={usageStats.usage} />}
      <Outlet />
    </MainLayout>
  );
}
