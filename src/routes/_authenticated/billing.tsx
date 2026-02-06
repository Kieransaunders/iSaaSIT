import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Building2, Users, UserCircle } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/billing')({
  component: BillingPage,
});

function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the Free plan
              </CardDescription>
            </div>
            <Badge variant="secondary">Free</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <UsageCard
                icon={Building2}
                label="Customers"
                used={0}
                max={3}
              />
              <UsageCard
                icon={Users}
                label="Team Members"
                used={1}
                max={2}
              />
              <UsageCard
                icon={UserCircle}
                label="External Users"
                used={0}
                max={10}
              />
            </div>
            <div className="pt-4 border-t">
              <Button>Upgrade Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PlanCard
          name="Free"
          price="$0"
          description="For small teams getting started"
          features={[
            "Up to 3 customers",
            "Up to 2 team members",
            "Up to 10 external users",
            "Basic support",
          ]}
          current
        />
        <PlanCard
          name="Pro"
          price="$29"
          description="For growing teams"
          features={[
            "Up to 25 customers",
            "Up to 10 team members",
            "Up to 100 external users",
            "Priority support",
            "Custom branding",
          ]}
        />
        <PlanCard
          name="Enterprise"
          price="Custom"
          description="For large teams"
          features={[
            "Unlimited customers",
            "Unlimited team members",
            "Unlimited external users",
            "24/7 dedicated support",
            "Custom integrations",
            "SLA guarantee",
          ]}
        />
      </div>
    </div>
  );
}

function UsageCard({
  icon: Icon,
  label,
  used,
  max,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  used: number;
  max: number;
}) {
  const percentage = Math.min((used / max) * 100, 100);
  
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold mb-2">
        {used} <span className="text-sm font-normal text-muted-foreground">/ {max}</span>
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

function PlanCard({
  name,
  price,
  description,
  features,
  current,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  current?: boolean;
}) {
  return (
    <Card className={current ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {current && <Badge>Current</Badge>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">
          {price}
          {price !== "Custom" && <span className="text-sm font-normal text-muted-foreground">/month</span>}
        </div>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
        <Button variant={current ? "outline" : "default"} className="w-full" disabled={current}>
          {current ? "Current Plan" : "Upgrade"}
        </Button>
      </CardContent>
    </Card>
  );
}
