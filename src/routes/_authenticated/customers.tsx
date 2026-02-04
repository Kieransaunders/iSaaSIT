import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Plus, Search, MoreHorizontal, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Route = createFileRoute('/_authenticated/customers')({
  component: CustomersPage,
});

function CustomersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Fetch data
  const customers = useQuery(api.customers.crud.listCustomers);
  const usage = useQuery(api.customers.crud.getCustomerUsage);

  // Mutations
  const createCustomer = useMutation(api.customers.crud.createCustomer);
  const deleteCustomer = useMutation(api.customers.crud.deleteCustomer);

  // Filter customers by search
  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCustomer = async (data: { name: string; email?: string; notes?: string }) => {
    await createCustomer({
      name: data.name,
      email: data.email,
      notes: data.notes,
    });
    setIsCreateOpen(false);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    await deleteCustomer({ customerId: customerToDelete as any });
    setCustomerToDelete(null);
  };

  const isLoading = customers === undefined || usage === undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your agency&apos;s client companies
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={usage?.atLimit}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <CreateCustomerForm
              onSubmit={handleCreateCustomer}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Alert */}
      {usage && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Plan Usage</p>
                <p className="text-sm text-muted-foreground">
                  {usage.count} of {usage.max} customers used
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-48">
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(usage.count / usage.max) * 100}%` }}
                    />
                  </div>
                </div>
                {usage.atLimit && (
                  <Badge variant="destructive">At Limit</Badge>
                )}
              </div>
            </div>
            {usage.atLimit && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You&apos;ve reached your customer limit.{' '}
                  <a href="/billing" className="underline">
                    Upgrade your plan
                  </a>{' '}
                  to add more customers.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${filteredCustomers?.length || 0} customer${filteredCustomers?.length !== 1 ? 's' : ''}`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCustomers?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Building2 className="h-8 w-8" />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium mb-1">No customers found</h3>
                  <p className="text-sm">Try adjusting your search</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-1">No customers yet</h3>
                  <p className="text-sm max-w-sm mb-4">
                    Get started by adding your first customer.
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)} disabled={usage?.atLimit}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first customer
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCustomers?.map((customer) => (
                <div
                  key={customer._id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{customer.name}</h4>
                    {customer.email && (
                      <p className="text-sm text-muted-foreground truncate">
                        {customer.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate({ to: `/customers/${customer._id}` })}>
                        <Edit className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setCustomerToDelete(customer._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateCustomerForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; email?: string; notes?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Customer</DialogTitle>
        <DialogDescription>
          Add a new client company to your agency.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            placeholder="Acme Corporation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@acme.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional information about this customer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Customer
        </Button>
      </DialogFooter>
    </form>
  );
}
