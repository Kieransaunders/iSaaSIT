import { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CapReachedBanner } from '@/components/billing/CapReachedBanner';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'client'>('staff');
  const [customerId, setCustomerId] = useState<Id<'customers'> | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvitation = useAction(api.invitations.send.sendInvitation);
  const customers = useQuery(api.customers.crud.listCustomers);
  const usageStats = useQuery(api.billing.queries.getUsageStats);

  const resetForm = () => {
    setEmail('');
    setRole('staff');
    setCustomerId(undefined);
    setError(null);
    setIsSubmitting(false);
  };

  const mapInviteError = (message: string) => {
    const cleaned = message.replace(/^Failed to send invitation:\s*/i, '').trim();

    if (cleaned.includes('Staff limit reached')) {
      return 'You have reached your staff limit. Upgrade your plan to invite more staff members.';
    }

    if (cleaned.includes('Client limit reached')) {
      return 'You have reached your client limit. Upgrade your plan to invite more clients.';
    }

    if (cleaned.includes('Customer ID required')) {
      return 'Please select a customer for a client invitation.';
    }

    if (cleaned.toLowerCase().includes('already a member')) {
      return 'That user is already a member of this organization.';
    }

    if (cleaned.toLowerCase().includes('invitation is already pending')) {
      return 'An invitation is already pending for that email.';
    }

    return cleaned || 'Failed to send invitation. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate customer selection for client role
    if (role === 'client' && !customerId) {
      setError('Please select a customer for client invitation');
      return;
    }

    setIsSubmitting(true);

    try {
      await sendInvitation({
        email: email.trim(),
        role,
        customerId: role === 'client' ? customerId : undefined,
      });

      // Success - close dialog and reset form
      onOpenChange(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      const mappedError = mapInviteError(message);
      setError(mappedError);
      toast.error(mappedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  const staffUsage = usageStats?.usage.staff;
  const clientUsage = usageStats?.usage.clients;
  const isAtLimit = role === 'staff'
    ? !!staffUsage && staffUsage.count >= staffUsage.max
    : role === 'client'
      ? !!clientUsage && clientUsage.count >= clientUsage.max
      : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value as 'staff' | 'client');
                  // Reset customer selection when switching roles
                  if (value !== 'client') {
                    setCustomerId(undefined);
                  }
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'client' && (
              <div className="grid gap-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select
                  value={customerId}
                  onValueChange={(value) => setCustomerId(value as Id<'customers'>)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers === undefined ? (
                      <SelectItem value="loading" disabled>
                        Loading customers...
                      </SelectItem>
                    ) : customers.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No customers available
                      </SelectItem>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === 'staff' && staffUsage && (
              <CapReachedBanner
                resourceType="staff"
                currentCount={staffUsage.count}
                maxCount={staffUsage.max}
              />
            )}

            {role === 'client' && clientUsage && (
              <CapReachedBanner
                resourceType="clients"
                currentCount={clientUsage.count}
                maxCount={clientUsage.max}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isAtLimit}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
