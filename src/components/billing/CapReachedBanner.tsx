import { Link } from "@tanstack/react-router";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CapReachedBannerProps {
  resourceType: "customers" | "staff" | "clients";
  currentCount: number;
  maxCount: number;
}

/**
 * Inline upgrade prompt shown in dialogs/forms when plan limits are reached.
 * Compact design that fits inside forms without overwhelming UI.
 */
export function CapReachedBanner({
  resourceType,
  currentCount,
  maxCount,
}: CapReachedBannerProps) {
  // Only show when at limit
  if (currentCount < maxCount) {
    return null;
  }

  const resourceLabel = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);

  return (
    <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 w-full">
      <div className="p-4">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {resourceLabel} limit reached ({currentCount}/{maxCount})
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Upgrade your plan to add more {resourceType}.
            </p>
            <Link to="/billing">
              <Button size="sm" variant="default" className="mt-2">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface UsageWarningBannerProps {
  usage: {
    customers: { count: number; max: number };
    staff: { count: number; max: number };
    clients: { count: number; max: number };
  };
}

/**
 * App-wide banner shown at 80%+ usage on any resource.
 * Dismissible banner with amber styling. Reappears on page refresh.
 */
export function UsageWarningBanner({ usage }: UsageWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Calculate which resources are at 80%+ usage
  const warningResources: Array<{ name: string; count: number; max: number }> = [];

  if (usage.customers.count / usage.customers.max >= 0.8) {
    warningResources.push({
      name: "Customers",
      count: usage.customers.count,
      max: usage.customers.max,
    });
  }

  if (usage.staff.count / usage.staff.max >= 0.8) {
    warningResources.push({
      name: "Staff",
      count: usage.staff.count,
      max: usage.staff.max,
    });
  }

  if (usage.clients.count / usage.clients.max >= 0.8) {
    warningResources.push({
      name: "Clients",
      count: usage.clients.count,
      max: usage.clients.max,
    });
  }

  // Don't show if no resources at 80%+ or if dismissed
  if (warningResources.length === 0 || isDismissed) {
    return null;
  }

  const resourceSummary = warningResources
    .map((resource) => `${resource.name}: ${resource.count}/${resource.max}`)
    .join(", ");

  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-6">
      <div className="flex flex-col sm:flex-row items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <AlertDescription className="block text-amber-900 dark:text-amber-100">
            <p className="text-sm">
              <span className="font-medium">You&apos;re approaching your plan limits.</span>{" "}
              {resourceSummary}.{" "}
              <Link to="/billing" className="underline font-medium">
                Upgrade
              </Link>{" "}
              to increase your limits.
            </p>
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
          <Link to="/billing">
            <Button size="sm" variant="default">
              Upgrade
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
