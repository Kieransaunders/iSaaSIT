import { createFileRoute } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/tools")({
  component: ToolsPage,
});

type StatusState = "ok" | "warn" | "error" | "unknown";

function StatusIcon({ state }: { state: StatusState }) {
  if (state === "ok") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }
  if (state === "warn") {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
  if (state === "error") {
    return <XCircle className="h-4 w-4 text-destructive" />;
  }
  return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
}

function StatusRow({
  label,
  value,
  state,
}: {
  label: string;
  value: string;
  state: StatusState;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <div className="flex items-center gap-2 text-sm">
        <StatusIcon state={state} />
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function ToolsPage() {
  const orgCheck = useQuery(api.orgs.get.hasOrg);
  const isAdmin = orgCheck?.role === "admin";

  const status = useQuery(api.tools.getStatus, isAdmin ? {} : "skip");
  const customers = useQuery(api.customers.crud.listCustomers, isAdmin ? {} : "skip");
  const simulateWebhook = useAction(api.tools.simulateWorkOSWebhook);

  const [role, setRole] = useState<"staff" | "client">("staff");
  const [customerId, setCustomerId] = useState<Id<"customers"> | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    ok: boolean;
    status: number;
    message: string;
    userId?: string;
  } | null>(null);

  const defaultEmail = useMemo(() => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `test+${stamp}@example.com`;
  }, []);

  const [email, setEmail] = useState(defaultEmail);

  const canRun =
    !isRunning &&
    email.trim().length > 3 &&
    (role === "staff" || !!customerId);

  if (orgCheck === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Admins only. You do not have access to Tools.</AlertDescription>
      </Alert>
    );
  }

  if (status === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const convexState: StatusState = status.convex.connected ? "ok" : "error";
  const workosClientState: StatusState = status.workos.clientIdSet ? "ok" : "error";
  const workosApiState: StatusState = status.workos.apiKeySet ? "ok" : "error";
  const workosWebhookState: StatusState = status.workos.webhookSecretSet ? "ok" : "error";
  const webhookTestState: StatusState = lastResult ? (lastResult.ok ? "ok" : "error") : "unknown";
  const billingPlanMappingMissing =
    (status.billing.apiKeySet || status.billing.webhookSecretSet) &&
    !status.billing.proVariantIdSet &&
    !status.billing.businessVariantIdSet;
  const billingPlanMappingState: StatusState = status.billing.proVariantIdSet ||
    status.billing.businessVariantIdSet
    ? "ok"
    : billingPlanMappingMissing
      ? "warn"
      : "unknown";

  const environmentLabel = import.meta.env.DEV ? "Development" : "Production";
  const apiKeyIsTest = status.workos.apiKeyIsTest === true;
  const apiKeyBadgeState: StatusState = status.workos.apiKeySet
    ? apiKeyIsTest
      ? "ok"
      : "warn"
    : "error";

  const handleRunTest = async () => {
    if (!canRun) return;
    setIsRunning(true);
    setLastResult(null);

    try {
      const result = await simulateWebhook({
        email,
        role,
        customerId: role === "client" ? customerId : undefined,
      });
      setLastResult({
        ok: result.ok,
        status: result.status,
        message: result.message,
        userId: result.userId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook test failed";
      setLastResult({ ok: false, status: 500, message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
        <p className="text-muted-foreground">Environment status and integration checks</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Current deployment status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="Convex" value="Connected" state={convexState} />
            <StatusRow
              label="Mode"
              value={environmentLabel}
              state={import.meta.env.DEV ? "warn" : "ok"}
            />
            <StatusRow
              label="Deployment"
              value={status.convex.deployment || "Unknown"}
              state={status.convex.deployment ? "ok" : "unknown"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WorkOS</CardTitle>
            <CardDescription>Configuration health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow
              label="Client ID"
              value={status.workos.clientIdSet ? "Set" : "Missing"}
              state={workosClientState}
            />
            <StatusRow
              label="API Key"
              value={
                status.workos.apiKeySet
                  ? status.workos.apiKeyIsTest
                    ? "Test key"
                    : "Live key"
                  : "Missing"
              }
              state={workosApiState}
            />
            <StatusRow
              label="Webhook Secret"
              value={status.workos.webhookSecretSet ? "Set" : "Missing"}
              state={workosWebhookState}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Test</CardTitle>
            <CardDescription>Last simulated event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <StatusIcon state={webhookTestState} />
                <span className="font-medium">invitation.accepted</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {lastResult ? `${lastResult.status}` : "Not run"}
              </span>
            </div>
            {lastResult && (
              <div className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                {lastResult.message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Optional Lemon Squeezy checks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow
              label="API Key"
              value={status.billing.apiKeySet ? "Set" : "Missing"}
              state={status.billing.apiKeySet ? "ok" : "warn"}
            />
            <StatusRow
              label="Webhook Secret"
              value={status.billing.webhookSecretSet ? "Set" : "Missing"}
              state={status.billing.webhookSecretSet ? "ok" : "warn"}
            />
            <StatusRow
              label="Plan Mapping"
              value={
                status.billing.proVariantIdSet || status.billing.businessVariantIdSet
                  ? "Ready"
                  : "Missing variant IDs"
              }
              state={billingPlanMappingState}
            />
            {billingPlanMappingMissing && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900 dark:text-amber-100">
                  Lemon Squeezy is configured, but no plan variant IDs are set in Convex.
                  Paid subscriptions will default to free tier limits.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Simulator</CardTitle>
          <CardDescription>Send a signed WorkOS webhook to Convex</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-email">Invite Email</Label>
              <Input
                id="test-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) => {
                  const nextRole = value as "staff" | "client";
                  setRole(nextRole);
                  if (nextRole !== "client") {
                    setCustomerId(undefined);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {role === "client" && (
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                value={customerId ?? ""}
                onValueChange={(value) => setCustomerId(value as Id<"customers">)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {(customers || []).map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customers === undefined && (
                <p className="text-xs text-muted-foreground">Loading customers…</p>
              )}
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleRunTest} disabled={!canRun}>
              {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Webhook Test
            </Button>
            <Badge variant={status.workos.webhookSecretSet ? "secondary" : "destructive"}>
              <StatusIcon state={workosWebhookState} />
              Webhook secret {status.workos.webhookSecretSet ? "set" : "missing"}
            </Badge>
            <Badge variant={apiKeyIsTest ? "secondary" : "outline"}>
              <StatusIcon state={apiKeyBadgeState} />
              {apiKeyIsTest
                ? "Test mode only"
                : status.workos.apiKeySet
                  ? "Live key detected"
                  : "API key missing"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
