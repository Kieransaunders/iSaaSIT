import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowLeft, Save, Loader2, Calendar, Mail, FileText, X, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/customers/$customerId')({
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { customerId } = useParams({ from: '/_authenticated/customers/$customerId' });
  const navigate = useNavigate();

  const customer = useQuery(api.customers.crud.getCustomer, { customerId: customerId as any });
  const updateCustomer = useMutation(api.customers.crud.updateCustomer);

  // User role check for admin-only features
  const userInfo = useQuery(api.orgs.get.hasOrg);
  const isAdmin = userInfo?.role === 'admin';

  // Staff assignment queries and mutations
  const assignedStaff = useQuery(api.assignments.queries.listAssignedStaff, { customerId: customerId as any });
  const availableStaff = useQuery(api.assignments.queries.listAvailableStaff, { customerId: customerId as any });
  const assignStaffMutation = useMutation(api.assignments.mutations.assignStaff);
  const unassignStaffMutation = useMutation(api.assignments.mutations.unassignStaff);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
  });

  // Initialize form when customer loads
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email || '',
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      await updateCustomer({
        customerId: customerId as any,
        name: formData.name,
        email: formData.email || undefined,
        notes: formData.notes || undefined,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignStaff = async (staffUserId: string) => {
    try {
      await assignStaffMutation({
        customerId: customerId as any,
        userId: staffUserId as any,
      });
    } catch (error) {
      console.error('Failed to assign staff:', error);
    }
  };

  const handleUnassignStaff = async (staffUserId: string) => {
    try {
      await unassignStaffMutation({
        customerId: customerId as any,
        userId: staffUserId as any,
      });
    } catch (error) {
      console.error('Failed to unassign staff:', error);
    }
  };

  if (customer === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (customer === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold mb-2">Customer not found</h1>
        <p className="text-muted-foreground mb-4">This customer may have been deleted.</p>
        <Button onClick={() => navigate({ to: '/customers' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/customers' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              setFormData({
                name: customer.name,
                email: customer.email || '',
                notes: customer.notes || '',
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Customer Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
            <CardDescription>
              View and manage customer information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={6}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{customer.email || 'No email provided'}</p>
                    <p className="text-sm text-muted-foreground">Contact Email</p>
                  </div>
                </div>

                {customer.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium whitespace-pre-wrap">{customer.notes}</p>
                      <p className="text-sm text-muted-foreground">Notes</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {format(customer.createdAt, 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">Added on</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {format(customer.updatedAt, 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">Last updated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Assignment Card - Admin Only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Staff</CardTitle>
                <CardDescription>
                  Staff members with access to this customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* List of assigned staff */}
                  {assignedStaff === undefined ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : assignedStaff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No staff assigned yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assignedStaff.map((staff) => (
                        <div
                          key={staff._id}
                          className="flex items-center justify-between p-2 rounded-lg border bg-card"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {staff.firstName && staff.lastName
                                ? `${staff.firstName} ${staff.lastName}`
                                : staff.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {staff.email}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassignStaff(staff._id)}
                            className="ml-2 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assign staff dropdown */}
                  {availableStaff !== undefined && availableStaff.length > 0 && (
                    <div className="pt-2 border-t">
                      <Select onValueChange={handleAssignStaff}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Assign staff..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStaff.map((staff) => (
                            <SelectItem key={staff._id} value={staff._id}>
                              {staff.firstName && staff.lastName
                                ? `${staff.firstName} ${staff.lastName}`
                                : staff.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {availableStaff !== undefined && availableStaff.length === 0 && assignedStaff !== undefined && assignedStaff.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      All staff members have been assigned
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
