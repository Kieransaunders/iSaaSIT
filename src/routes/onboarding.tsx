import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { getAuth } from '@workos/authkit-tanstack-react-start';
import { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/onboarding')({
  loader: async () => {
    const { user } = await getAuth();
    if (!user) {
      throw redirect({ to: '/' });
    }
    return { user };
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = Route.useLoaderData();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [billingEmail, setBillingEmail] = useState(user?.email || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if user already has an org
  const hasOrgResult = useQuery(api.orgs.get.hasOrg);
  const createOrg = useAction(api.workos.createOrg.createOrganization);

  // If user already has org, redirect to dashboard
  if (hasOrgResult?.hasOrg) {
    navigate({ to: '/dashboard' });
    return null;
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !billingEmail.trim()) return;
    if (!billingEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await createOrg({
        name: orgName.trim(),
        billingEmail: billingEmail.trim(),
      });

      setIsSuccess(true);

      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create organization. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isSuccess ? 'Organization Created!' : 'Create Your Organization'}
            </CardTitle>
            <CardDescription>
              {isSuccess
                ? 'Redirecting you to your dashboard...'
                : 'Set up your workspace to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSuccess && (
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="Acme Inc"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be the name of your organization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing-email">Billing Email</Label>
                  <Input
                    id="billing-email"
                    type="email"
                    placeholder="billing@yourcompany.com"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Invoices and billing notifications will be sent here
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="flex flex-col gap-2">
                        <div>{error}</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCreateOrg}
                          disabled={isLoading}
                        >
                          Try Again
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !orgName.trim() || !billingEmail.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </form>
            )}

            {isSuccess && (
              <div className="py-8 flex flex-col items-center text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-4" />
                <p className="font-medium">{orgName} is ready!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Signed in as {user.email}
        </p>
      </div>
    </div>
  );
}
