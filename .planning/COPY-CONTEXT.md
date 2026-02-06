# App Copy & Terminology - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Scope

Replace agency-specific copy **inside the authenticated app** with generic terminology suitable for any business type. The landing page / marketing site keeps its current agency/developer messaging — that audience IS developers and agencies building with the starter kit.

**Two audiences, two voices:**
1. **Landing page** → Talks to developers/agencies who will build with the kit. "Agency" is correct here.
2. **Inside the app** → Talks to end users of whatever gets built. Must be generic — plumbers, consultants, agencies, anyone.

</domain>

<decisions>
## Implementation Decisions

### Core terminology replacement
- "your agency" → "your workspace" throughout the authenticated app
- "agency" as a descriptor is removed from all in-app copy
- Landing page copy is NOT changed

### Entity terminology
- "Customers" stays — generic enough for any business
- Remove "client companies" descriptions — just "customers"
- Simple and direct tone: "Manage your customers" not "Manage your agency's client companies"

### Sidebar
- App name stays as "iSaaSIT" (or whatever the fork names it)
- Subtitle changes from "Agency Portal" → show the **org name** dynamically
- Navigation labels stay: Dashboard, Customers, Team, Billing, Settings

### Team & role labels
- "Team" section shows org-level users
- "Staff Members" → "Team Members" (internal users)
- "Client Users" → "External Users" (limited portal access)
- Team Members described as: "Your team"
- External Users described as: "External users with limited access"
- Org-level roles: Owner, Admin, Member

### Onboarding copy
- "Set up your agency workspace" → "Set up your workspace"
- Keep "Create Your Organization" as the form title
- Remove any "agency" references from onboarding flow

### Dashboard copy
- "Here's an overview of your agency" → "Overview of your workspace"
- Stat cards and sections keep current labels (Total Customers, Team Members, etc.)

### Empty states
- "No customers yet" / "Get started by adding your first customer" — drop "agency" references
- "No staff members yet" → "No team members yet"
- Keep the helpful action-oriented tone

### Page meta
- "iSaaSIT - Agency Management Platform" needs updating to something generic

### Claude's Discretion
- Exact wording per empty state (keep simple and direct)
- Page meta title replacement
- Any minor copy adjustments needed for consistency

</decisions>

<specifics>
## Specific Ideas

- Sidebar subtitle should dynamically show the org name — makes it personal, not generic
- "Workspace" is the universal replacement for "agency" — it works for everyone
- Keep copy minimal: "Manage your customers" not "Manage your customer accounts and relationships"
- The three-layer model is: Platform → Org → Data (Customers)

### Three-layer user model
1. **Platform Admin** ("Admin Console" at `/admin`) — the SaaS operator who deployed the kit
2. **Org level** — Owner + Team Members + External Users
3. **Data level** — Customers (CRM entities belonging to the org)

</specifics>

<deferred>
## Deferred Ideas

### Admin Console (significant feature — own phase(s))
- Separate route at `/admin` — "app within the app", own sidebar and views
- Called "Admin Console" in the UI
- Platform-level admin (SaaS operator) who can manage all orgs
- Features discussed:
  - **All Orgs + impersonate** — see every org, jump into any as the owner
  - **Platform metrics** — total orgs, users, revenue, growth dashboard
  - **User management** — all users across all orgs, suspend/unsuspend, reset
  - **System settings** — platform config, feature flags, billing plans, webhook logs
- This is a major feature set that should be its own phase or milestone

### Platform Super Admin role
- Architectural: needs a way to flag certain users as platform admins
- Separate from org-level admin role
- Can impersonate org users for troubleshooting

</deferred>

---

*Cross-cutting: copy-terminology*
*Context gathered: 2026-02-06*
