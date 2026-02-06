import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Settings, Building2, Bell, Shield, Loader2 } from 'lucide-react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const org = useQuery(api.orgs.get.getMyOrg);
  const updateOrg = useAction(api.workos.updateOrg.updateOrganization);

  const [orgName, setOrgName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form when org loads
  useEffect(() => {
    if (org) {
      setOrgName(org.name);
      setBillingEmail(org.billingEmail || '');
    }
  }, [org]);

  // Check if form has changes
  const hasChanges = org && (
    orgName !== org.name ||
    billingEmail !== (org.billingEmail || '')
  );

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateOrg({
        name: orgName !== org?.name ? orgName : undefined,
        billingEmail: billingEmail !== org?.billingEmail ? billingEmail : undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save changes'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (org === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Organization</CardTitle>
            </div>
            <CardDescription>
              Update your organization details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="Enter organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billing-email">Billing Email</Label>
              <Input
                id="billing-email"
                type="email"
                placeholder="billing@example.com"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Where we'll send invoices and billing updates
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
            {saveError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
            {saveSuccess && (
              <Alert className="mt-4">
                <AlertDescription>Changes saved successfully!</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive email updates about your account
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Team Member Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when someone joins your team
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates about new features and offers
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage security settings for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Require 2FA for all team members
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SSO Required</Label>
                <p className="text-xs text-muted-foreground">
                  Require single sign-on for authentication
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
