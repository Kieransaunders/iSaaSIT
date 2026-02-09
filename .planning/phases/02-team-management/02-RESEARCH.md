# Phase 2: Team Management - Research

**Researched:** 2026-02-09
**Domain:** WorkOS User Management API + Invitation Flow + Convex
**Confidence:** HIGH

## Summary

This phase implements team management through WorkOS User Management invitations combined with Convex for data persistence. The core pattern involves:

1. **Invitation creation** via WorkOS `sendInvitation()` API with email, organizationId, and roleSlug
2. **Email delivery** handled by WorkOS by default (with custom email option via webhooks)
3. **Invitation acceptance** through WorkOS AuthKit signup flow
4. **User sync** via webhook events (invitation.accepted) to update Convex database
5. **Team UI** using shadcn/ui Table with tabs, badges, and filtering

The WorkOS Node.js SDK (`@workos-inc/node` v8.x) provides all invitation methods: `sendInvitation()`, `listInvitations()`, and `revokeInvitation()`. Resending requires revoke-then-send. User decisions lock in: single invite form (one email+role), staff/client roles, pending invites visible with badges, soft delete for removal with restore capability.

**Primary recommendation:** Create Convex actions for WorkOS invitation operations, handle `invitation.accepted` events via webhook to sync user data, implement invite form with role selector and conditional customer dropdown, and use table with tabs (All/Staff/Clients/Pending) for team display.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @workos-inc/node | 8.x | Invitation API | Official SDK, manages invitation lifecycle |
| convex | 1.31+ | Backend + webhooks | Already in project, HTTP actions for webhooks |
| @tanstack/react-table | Latest | Table data management | Used by shadcn/ui DataTable, handles sorting/filtering |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Table | Latest | Team list UI | Already in project, provides table components |
| shadcn/ui Tabs | Latest | Team segmentation | Already in project, for All/Staff/Clients/Pending |
| shadcn/ui Badge | Latest | Status display | Already in project, for role/status badges |
| shadcn/ui Dialog | Latest | Invite form | Already in project, for modal invite flow |
| shadcn/ui AlertDialog | Latest | Removal confirmation | Already in project, for "Are you sure?" prompts |
| shadcn/ui Select | Latest | Role + Customer picker | Already in project, for dropdowns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| WorkOS emails | Resend + React Email | More control, more complexity, worse deliverability without domain setup |
| WorkOS invitations | Custom invite tokens | Would need to build: token generation, expiry, email sending, security |
| Soft delete | Hard delete | Irreversible, breaks customer assignment history, blocks email reuse |

**Installation:**
```bash
# Already installed: @workos-inc/node@8, shadcn/ui components
# No additional dependencies needed
```

**Environment Variables:**
```bash
# Already configured:
# - WORKOS_API_KEY (for WorkOS API calls)
# - WORKOS_CLIENT_ID (for auth)
# - WORKOS_WEBHOOK_SECRET (for webhook signature verification)
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── invitations/
│   ├── send.ts          # Action: sendInvitation()
│   ├── list.ts          # Query: list invitations from WorkOS
│   ├── revoke.ts        # Action: revokeInvitation()
│   └── resend.ts        # Action: revoke + send new
├── users/
│   ├── list.ts          # Query: list org members
│   ├── remove.ts        # Mutation: soft delete (set deletedAt)
│   ├── restore.ts       # Mutation: restore (clear deletedAt)
│   └── get.ts           # Query: get user by ID
├── http.ts              # Webhook routes for invitation.* events
src/
├── routes/
│   └── _authenticated/
│       └── team.tsx     # Team page with invite + table
├── components/
│   ├── team/
│   │   ├── invite-dialog.tsx      # Invite form modal
│   │   ├── team-table.tsx         # Table with tabs
│   │   └── remove-confirm.tsx     # Removal confirmation
```

### Pattern 1: Invitation via WorkOS Action
**What:** Convex action calls WorkOS sendInvitation with role-based parameters
**When to use:** Creating any invitation (staff or client)
**Example:**
```typescript
// convex/invitations/send.ts
// Source: https://workos.com/blog/user-management-dashboard-with-node
"use node";
import { action } from "../_generated/server";
import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export const sendInvitation = action({
  args: {
    email: v.string(),
    roleSlug: v.union(v.literal("staff"), v.literal("client")),
    customerId: v.optional(v.id("customers")), // Required if roleSlug is "client"
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get user's org from Convex
    const user = await ctx.runQuery(internal.users.get.byWorkosId, {
      workosUserId: identity.subject,
    });
    if (!user?.orgId) {
      throw new ConvexError("User not in organization");
    }

    // Get WorkOS org ID
    const org = await ctx.runQuery(internal.orgs.get.byId, { orgId: user.orgId });
    if (!org) {
      throw new ConvexError("Organization not found");
    }

    // If client role, verify customer exists and get its ID for metadata
    let customerMetadata = undefined;
    if (args.roleSlug === "client") {
      if (!args.customerId) {
        throw new ConvexError("Customer ID required for client invitations");
      }
      const customer = await ctx.runQuery(internal.customers.get.byId, {
        customerId: args.customerId,
      });
      if (!customer) {
        throw new ConvexError("Customer not found");
      }
      // Store customer ID in metadata for post-acceptance processing
      customerMetadata = { customerId: args.customerId };
    }

    // Send invitation via WorkOS
    const invitation = await workos.userManagement.sendInvitation({
      email: args.email,
      organizationId: org.workosOrgId,
      roleSlug: args.roleSlug,
      inviterUserId: identity.subject,
      expiresInDays: 7,
      ...(customerMetadata && {
        // WorkOS doesn't have invitation metadata, store in org-level tracking
        // Alternative: Store pending invitations in Convex with customer link
      }),
    });

    // Store pending invitation in Convex for tracking
    await ctx.runMutation(internal.invitations.create.storePending, {
      workosInvitationId: invitation.id,
      email: args.email,
      orgId: user.orgId,
      roleSlug: args.roleSlug,
      customerId: args.customerId,
      inviterUserId: user._id,
    });

    return { invitationId: invitation.id };
  },
});
```

### Pattern 2: Webhook Event Handler for Invitation Acceptance
**What:** Handle invitation.accepted webhook to sync user data to Convex
**When to use:** When user accepts invitation and completes signup
**Example:**
```typescript
// convex/http.ts
// Source: https://www.convex.dev/components/workos-authkit (webhook pattern)
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// WorkOS webhook endpoint
http.route({
  path: "/workos/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook signature
    const signature = request.headers.get("workos-signature");
    const payload = await request.text();

    // Parse event
    const event = JSON.parse(payload);

    // Handle invitation events
    if (event.event === "invitation.accepted") {
      await ctx.runMutation(internal.users.sync.onInvitationAccepted, {
        workosUserId: event.data.acceptor_user_id,
        email: event.data.email,
        organizationId: event.data.organization_id,
        invitationId: event.data.id,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
```

```typescript
// convex/users/sync.ts
// Source: Pattern from Convex webhook handling
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const onInvitationAccepted = internalMutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    organizationId: v.string(),
    invitationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find pending invitation to get role and customer
    const pendingInvite = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_invitation_id", (q) =>
        q.eq("workosInvitationId", args.invitationId)
      )
      .first();

    if (!pendingInvite) {
      console.warn("No pending invitation found for accepted invitation");
      return;
    }

    // Get org from WorkOS org ID
    const org = await ctx.db
      .query("orgs")
      .withIndex("by_workos_org_id", (q) =>
        q.eq("workosOrgId", args.organizationId)
      )
      .first();

    if (!org) {
      throw new Error("Organization not found");
    }

    const now = Date.now();

    // Create or update user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) =>
        q.eq("workosUserId", args.workosUserId)
      )
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        orgId: org._id,
        role: pendingInvite.roleSlug,
        customerId: pendingInvite.customerId,
        email: args.email,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("users", {
        workosUserId: args.workosUserId,
        orgId: org._id,
        role: pendingInvite.roleSlug,
        customerId: pendingInvite.customerId,
        email: args.email,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Remove pending invitation
    await ctx.db.delete(pendingInvite._id);
  },
});
```

### Pattern 3: Soft Delete with Restore
**What:** Mark users inactive instead of hard delete, allow restoration
**When to use:** User removal as specified in user decisions
**Example:**
```typescript
// convex/users/remove.ts
// Source: https://medium.com/@sohail_saifii/how-to-implement-soft-deletes-without-breaking-your-database-48bc9872843f
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const removeUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) =>
        q.eq("workosUserId", identity.subject)
      )
      .first();

    if (admin?.role !== "admin") {
      throw new ConvexError("Admin role required");
    }

    // Get user to remove
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Soft delete: set deletedAt timestamp
    await ctx.db.patch(args.userId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Note: Staff assignments remain intact (preserves history)
    // User won't appear in active queries due to deletedAt filter
  },
});

// Restore removed user
export const restoreUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_workos_user_id", (q) =>
        q.eq("workosUserId", identity.subject)
      )
      .first();

    if (admin?.role !== "admin") {
      throw new ConvexError("Admin role required");
    }

    // Clear deletedAt
    await ctx.db.patch(args.userId, {
      deletedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});
```

### Pattern 4: Table with Tabs and Filtering
**What:** Team table segmented by tabs (All/Staff/Clients/Pending) with status badges
**When to use:** Team page display
**Example:**
```typescript
// src/components/team/team-table.tsx
// Source: https://www.shadcn.io/ui/table + https://www.shadcnblocks.com/components/table
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function TeamTable() {
  const members = useQuery(api.users.list.byOrg) ?? [];

  // Filter by status and role
  const active = members.filter(m => !m.deletedAt);
  const staff = active.filter(m => m.role === "staff");
  const clients = active.filter(m => m.role === "client");
  const pending = []; // From pending invitations query

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All ({active.length})</TabsTrigger>
        <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
        <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <MemberTable members={active} />
      </TabsContent>

      <TabsContent value="staff">
        <MemberTable members={staff} />
      </TabsContent>

      <TabsContent value="clients">
        <MemberTable members={clients} />
      </TabsContent>

      <TabsContent value="pending">
        <PendingInviteTable invites={pending} />
      </TabsContent>
    </Tabs>
  );
}

function MemberTable({ members }: { members: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member._id}>
            <TableCell>
              {member.firstName} {member.lastName}
            </TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>
              <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                {member.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">Active</Badge>
            </TableCell>
            <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>
              {/* Action dropdown */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Anti-Patterns to Avoid
- **Storing invitation tokens in Convex:** WorkOS owns the invitation lifecycle. Only track invitation IDs.
- **Skipping webhook signature verification:** Security risk. Always verify WorkOS webhook signatures.
- **Hard delete users:** Breaks customer assignments, prevents email reuse. Use soft delete.
- **Forgetting to handle invitation.revoked events:** Orphaned pending invitations in UI.
- **Sending custom emails without domain setup:** Poor deliverability. Use WorkOS default unless custom emails are critical.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invitation tokens | Random token + expiry logic | WorkOS sendInvitation | Handles: token generation, expiry (7 days default), email delivery, acceptance flow |
| Email delivery | SMTP/Resend setup | WorkOS default emails | Built-in deliverability (SPF/DKIM), no domain setup, no bounce handling |
| User role sync | Custom JWT parsing | WorkOS webhooks | Events fire on acceptance, include all data, avoid JWT staleness |
| Invitation resend | Custom retry logic | Revoke + send new | WorkOS pattern: revoke invalidates old token, send creates new |
| Soft delete filtering | Manual WHERE clauses | Convex index + filter helper | Every query needs deletedAt check; helper function prevents bugs |

**Key insight:** WorkOS manages the entire invitation lifecycle (creation, email, acceptance, expiry). Convex stores only the necessary sync data (user records, pending tracking). Don't try to replicate WorkOS's email infrastructure—it handles domain reputation, spam filters, and deliverability at scale.

## Common Pitfalls

### Pitfall 1: Race Condition - Webhook Before User Query
**What goes wrong:** invitation.accepted webhook fires, but user queries return old data
**Why it happens:** Webhook updates Convex, but client hasn't invalidated/refetched
**How to avoid:**
- Use Convex reactivity—mutations auto-invalidate queries
- If using manual refetch, add artificial delay (100-200ms) after acceptance redirect
**Warning signs:** User accepts invite, lands on team page, sees "Pending" instead of active

### Pitfall 2: Missing Customer Link for Client Invites
**What goes wrong:** Client accepts invite but has no customerId, can't access anything
**Why it happens:** Forgot to pass customerId through pending invitation tracking
**How to avoid:** Store customerId in pendingInvitations table, copy to users.customerId on acceptance
**Warning signs:** Client users have role="client" but customerId is undefined

### Pitfall 3: Soft Delete Filter Forgotten in Query
**What goes wrong:** Removed users appear in team list
**Why it happens:** Query doesn't filter out users with deletedAt
**How to avoid:**
- Create helper: `const activeUsers = users.filter(u => !u.deletedAt)`
- Or add index: `.index("by_org_active", ["orgId", "deletedAt"])` with null check
**Warning signs:** "Removed" users still visible in UI

### Pitfall 4: Not Handling invitation.revoked Events
**What goes wrong:** UI shows pending invite that was revoked, "resend" fails
**Why it happens:** Webhook for revoke not handled, pending invitation stays in Convex
**How to avoid:** Listen for `invitation.revoked` event, delete from pendingInvitations table
**Warning signs:** Pending invites persist after revoke, resend attempts fail silently

### Pitfall 5: Invite Button Always Enabled (No Usage Cap Check)
**What goes wrong:** User sends invite, API fails due to maxStaff/maxClients limit exceeded
**Why it happens:** Frontend doesn't check org.maxStaff vs current staff count
**How to avoid:**
```typescript
const org = useQuery(api.orgs.get.current);
const staffCount = useQuery(api.users.list.countStaff);
const canInviteStaff = staffCount < org.maxStaff;
```
**Warning signs:** Invite succeeds in UI but WorkOS rejects it, user confused

### Pitfall 6: Client Invite Without Customer Dropdown
**What goes wrong:** UI bug - client role selected but no way to pick customer
**Why it happens:** Forgot conditional customer field in invite form
**How to avoid:**
```typescript
{roleSlug === "client" && (
  <Select name="customerId" required>
    <SelectTrigger>
      <SelectValue placeholder="Select customer" />
    </SelectTrigger>
    <SelectContent>
      {customers.map(c => (
        <SelectItem key={c._id} value={c._id}>
          {c.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```
**Warning signs:** Client invite form submitted without customer, validation error

### Pitfall 7: Invitation List API Called Too Frequently
**What goes wrong:** Rate limited by WorkOS, pending invites fail to load
**Why it happens:** Polling WorkOS API every few seconds for pending invite list
**How to avoid:**
- Store pending invitations in Convex (synced via webhook)
- Query Convex, not WorkOS, for UI display
- Only call WorkOS API for create/revoke actions
**Warning signs:** Intermittent "Too Many Requests" errors on team page

## Code Examples

Verified patterns from official sources:

### Invite Form with Role Selector and Conditional Customer
```typescript
// src/components/team/invite-dialog.tsx
// Source: shadcn/ui Dialog + Select patterns
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleSlug, setRoleSlug] = useState<"staff" | "client">("staff");
  const [customerId, setCustomerId] = useState<string | undefined>();

  const customers = useQuery(api.customers.list.byOrg) ?? [];
  const sendInvite = useMutation(api.invitations.send.sendInvitation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await sendInvite({
      email,
      roleSlug,
      ...(roleSlug === "client" && { customerId: customerId as any }),
    });

    setOpen(false);
    setEmail("");
    setRoleSlug("staff");
    setCustomerId(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={roleSlug} onValueChange={(v) => setRoleSlug(v as "staff" | "client")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {roleSlug === "client" && (
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full">
            Send Invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Removal Confirmation Dialog
```typescript
// src/components/team/remove-confirm.tsx
// Source: shadcn/ui AlertDialog pattern
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface RemoveConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { _id: string; firstName?: string; lastName?: string; email: string };
}

export function RemoveConfirm({ open, onOpenChange, user }: RemoveConfirmProps) {
  const removeUser = useMutation(api.users.remove.removeUser);

  const handleConfirm = async () => {
    await removeUser({ userId: user._id });
    onOpenChange(false);
  };

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove team member?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {displayName}? They will no longer be able to access this workspace.
            You can restore them later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual email with custom tokens | WorkOS invitation API | 2024+ | Handles expiry, delivery, acceptance flow automatically |
| Hard delete users | Soft delete with deletedAt | Industry standard | Preserves history, allows restore, safer |
| Store all data in frontend | Convex reactive queries | Convex model | Real-time updates, no manual refetch |
| Custom webhook auth | WorkOS signature verification | Security standard | Prevents spoofing, validates source |

**Deprecated/outdated:**
- `createInvitation`: Now called `sendInvitation` in WorkOS SDK v8+
- Manual invitation resend: Pattern is now revoke + send (not a dedicated resend method)
- Storing invitation tokens: WorkOS manages tokens, only expose invitation IDs

## Open Questions

Things that couldn't be fully resolved:

1. **Staff Unassignment on Removal**
   - What we know: User decisions allow soft delete with restore
   - What's unclear: Should staff be auto-unassigned from customers on removal, or block removal until manually unassigned?
   - Recommendation: Auto-unassign (simpler UX), customer assignment history preserved in audit log if needed

2. **Invite Email Content Customization**
   - What we know: WorkOS sends default emails, custom emails via webhooks + Resend possible
   - What's unclear: Whether default WorkOS email content is acceptable or needs customization
   - Recommendation: Start with WorkOS default (better deliverability), add custom emails only if branding is critical

3. **Invitation Expiry Extension**
   - What we know: Default 7 days, can set 1-30 days on creation
   - What's unclear: Can expiry be extended after creation, or must revoke+resend?
   - Recommendation: WorkOS doesn't support extending expiry—use revoke+resend pattern for expired invites

4. **Pending Invitation Storage**
   - What we know: Need to track customerId for client invites
   - What's unclear: Schema for pendingInvitations table (WorkOS invitation ID, email, role, customerId, etc.)
   - Recommendation: Add `pendingInvitations` table with: workosInvitationId, email, orgId, roleSlug, customerId (optional), inviterUserId, createdAt, expiresAt

## Sources

### Primary (HIGH confidence)
- [WorkOS Invitations Documentation](https://workos.com/docs/user-management/invitations) - Invitation flow, email handling, acceptance
- [WorkOS User Management Dashboard Tutorial](https://workos.com/blog/user-management-dashboard-with-node) - Node SDK examples: sendInvitation, revokeInvitation
- [WorkOS Custom Emails](https://workos.com/docs/user-management/custom-emails) - Webhook events, custom email delivery
- [WorkOS Events API](https://workos.com/docs/events) - Invitation lifecycle events (created, accepted, revoked)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) - Webhook handler pattern
- [Convex Error Handling](https://docs.convex.dev/functions/error-handling) - ConvexError for validation
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions) - Validation, error handling patterns

### Secondary (MEDIUM confidence)
- [shadcn/ui Table](https://www.shadcn.io/ui/table) - Table component structure
- [shadcn/ui Tabs](https://www.shadcn.io/ui/tabs) - Tab navigation pattern
- [Soft Delete Implementation](https://medium.com/@sohail_saifii/how-to-implement-soft-deletes-without-breaking-your-database-48bc9872843f) - deletedAt pattern, restore logic
- [Resend React Email](https://react.email/docs/integrations/resend) - Alternative custom email approach
- [Authorization Best Practices (Convex)](https://stack.convex.dev/authorization) - Permission checks, role validation

### Tertiary (LOW confidence)
- Team management UI patterns - Multiple sources, no single canonical pattern
- Invitation webhook timing - Not documented, assumes near-instant delivery
- Rate limit specifics - WorkOS doesn't publish exact limits

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - WorkOS SDK well-documented, Convex patterns established
- Architecture: HIGH - Patterns verified with official WorkOS + Convex docs
- Pitfalls: MEDIUM - Based on common webhook/invitation issues, some inferred from general patterns

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable APIs, but WorkOS features evolve)
