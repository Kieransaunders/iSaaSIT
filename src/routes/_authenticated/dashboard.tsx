import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CreditCard, TrendingUp, Plus, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const org = useQuery(api.orgs.get.getMyOrg);
  const hasOrgCheck = useQuery(api.orgs.get.hasOrg);

  // Redirect to onboarding if no org
  useEffect(() => {
    if (hasOrgCheck && !hasOrgCheck.hasOrg) {
      navigate({ to: '/onboarding' });
    }
  }, [hasOrgCheck, navigate]);

  if (!org && hasOrgCheck?.hasOrg === false) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {org ? org.name : <Skeleton className="h-9 w-48" />}
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your workspace.
          </p>
        </div>
        {org && (
          <Badge variant={org.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
            {org.planId === 'free' ? 'Free Plan' : org.planId}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={org ? "0" : <Skeleton className="h-8 w-12" />}
          description="Active clients"
          icon={Building2}
          trend={`/${org?.maxCustomers ?? 3} limit`}
        />
        <StatCard
          title="Team Members"
          value="1"
          description="Team members & admins"
          icon={Users}
          trend={`/${org?.maxStaff ?? 2} limit`}
        />
        <StatCard
          title="Plan"
          value={org ? org.planId : <Skeleton className="h-8 w-20" />}
          description="Current tier"
          icon={CreditCard}
          trend={org?.subscriptionStatus === 'inactive' ? 'Upgrade available' : 'Active'}
        />
        <StatCard
          title="Active Projects"
          value="0"
          description="In progress"
          icon={TrendingUp}
          trend="No active projects"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-3 mb-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p>No activity yet</p>
              <p className="text-sm">Get started by creating your first customer</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <QuickActionButton
              label="Add Customer"
              description="Add a new client company"
              href="/customers"
              icon={Building2}
            />
            <QuickActionButton
              label="Invite Team Member"
              description="Add a team member"
              href="/team"
              icon={Users}
            />
            <QuickActionButton
              label="Upgrade Plan"
              description="Unlock more features"
              href="/billing"
              icon={CreditCard}
            />
          </CardContent>
        </Card>
      </div>

      {/* Usage Overview */}
      {org && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Usage</CardTitle>
            <CardDescription>
              Your current usage against plan limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <UsageBar label="Customers" used={0} max={org.maxCustomers} />
              <UsageBar label="Team Members" used={1} max={org.maxStaff} />
              <UsageBar label="External Users" used={0} max={org.maxClients} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: React.ReactNode;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({
  label,
  description,
  href,
  icon: Icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </a>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const percentage = Math.min((used / max) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{used} / {max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
