import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, UserCircle } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/team')({
  component: TeamPage,
});

function TeamPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team and their access
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Your team with access to customer data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <p>No team members yet</p>
              <p className="text-sm">Invite team members to collaborate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>External Users</CardTitle>
            <CardDescription>
              External users with limited access to their data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="rounded-full bg-muted p-3 mb-3">
                <UserCircle className="h-6 w-6" />
              </div>
              <p>No external users yet</p>
              <p className="text-sm">External users will appear here once invited</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
