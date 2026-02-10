import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAction, useQuery } from 'convex/react';
import { Building2, CreditCard, Loader2, Mail, TrendingUp, UserCircle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const org = useQuery(api.orgs.get.getMyOrg);
  const hasOrgCheck = useQuery(api.orgs.get.hasOrg);
  const userRole = hasOrgCheck?.role;
  const syncCurrentUser = useAction(api.users.syncActions.syncCurrentUserFromWorkOS);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ hasOrg: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    syncCurrentUser()
      .then((result) => {
        if (!cancelled) {
          setLastSyncResult(result);
        }
      })
      .catch((error) => {
        console.error('Failed to sync user from WorkOS:', error);
      })
      .finally(() => {
        if (!cancelled) {
          setSyncAttempted(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [syncCurrentUser]);

  // Redirect to onboarding if no org
  useEffect(() => {
    // Only redirect if sync finished AND the query says no org AND the sync action result says no org
    if (syncAttempted && hasOrgCheck && !hasOrgCheck.hasOrg && lastSyncResult?.hasOrg === false) {
      navigate({ to: '/onboarding' });
    }
  }, [hasOrgCheck, navigate, syncAttempted, lastSyncResult]);

  if (!org && hasOrgCheck?.hasOrg === false) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show different dashboard based on role
  if (userRole === 'client') {
    return <ClientDashboard />;
  }

  if (userRole === 'staff') {
    return <StaffDashboard org={org} />;
  }

  // Admin sees the org dashboard
  return <AdminDashboard org={org} />;
}

// Dashboard for client users
function ClientDashboard() {
  const customer = useQuery(api.customers.clientQueries.getMyCustomer);
  const assignedStaff = useQuery(api.customers.clientQueries.getMyAssignedStaff);
  const org = useQuery(api.orgs.get.getMyOrg);

  const isLoading = customer === undefined || assignedStaff === undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {customer ? customer.name : <Skeleton className="h-9 w-48" />}
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your company overview.
          </p>
        </div>
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Your company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : customer ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">Contact Email</p>
                  </div>
                </div>
              )}

              {customer.notes && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium whitespace-pre-wrap">{customer.notes}</p>
                    <p className="text-sm text-muted-foreground">Notes</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 pt-4 border-t">
                <UserCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    Member since {format(customer.createdAt, 'MMMM yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">Account Created</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No company information available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Staff Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Team</CardTitle>
          <CardDescription>
            {org?.name} staff members assigned to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : assignedStaff && assignedStaff.length > 0 ? (
            <div className="space-y-3">
              {assignedStaff.map((staff: any) => (
                <div
                  key={staff._id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {staff.firstName && staff.lastName
                        ? `${staff.firstName} ${staff.lastName}`
                        : staff.email}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {staff.email}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {staff.role === 'admin' ? 'Admin' : 'Staff'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <p>No staff members assigned yet</p>
              <p className="text-sm">Your account manager will be assigned soon</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <div className="rounded-full bg-muted p-3 mb-3">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p>No recent activity</p>
            <p className="text-sm">Activity will appear here as it happens</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard for staff users
function StaffDashboard({ org }: { org: any }) {
  const customers = useQuery(api.customers.crud.listCustomers);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {org ? org.name : <Skeleton className="h-9 w-48" />}
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your client workspace.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Assigned Customers"
          value={customers ? String(customers.length) : <Skeleton className="h-8 w-12" />}
          description="Clients you can access"
          icon={Building2}
          trend="Manage relationships"
        />
        <StatCard
          title="Active Projects"
          value="0"
          description="In progress"
          icon={TrendingUp}
          trend="No active projects"
        />
        <StatCard
          title="Tasks"
          value="0"
          description="Coming soon"
          icon={UserCircle}
          trend="Todo list planned"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="md:col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-3 mb-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p>No activity yet</p>
              <p className="text-sm">Updates will appear here as they happen</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for client work
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <QuickActionButton
              label="View Customers"
              description="Browse your assigned clients"
              href="/customers"
              icon={Building2}
            />
            <QuickActionButton
              label="Add Customer"
              description="Create a new client record"
              href="/customers"
              icon={Building2}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dashboard for admin users
function AdminDashboard({ org }: { org: any }) {
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="md:col-span-1 lg:col-span-4">
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
        <Card className="md:col-span-1 lg:col-span-3">
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
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
