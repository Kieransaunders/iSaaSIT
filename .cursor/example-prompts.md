# Example Prompts for iSaaSIT

Use these prompts as starting points for AI-assisted development.

---

## Initial Setup / PRD Prompt

```
I want to build a [type of SaaS] using iSaaSIT, an open-source SaaS starter kit.

Current stack:
- TanStack Start (React 19 + file-based routing)
- Convex (serverless backend + real-time database)
- WorkOS AuthKit (authentication + org management)
- Tailwind CSS v4 (styling)

What exists:
- User authentication via WorkOS
- Protected routes
- Convex backend with JWT validation

What I need:
[Describe your feature requirements here]

Please:
1. Analyze the existing codebase structure
2. Propose 2-3 implementation approaches
3. Recommend the best approach with reasoning
4. Use vertical slice development (start simple, add complexity iteratively)

Reference docs:
- Project overview: .cursor/rules/01-project-overview.mdc
- Convex patterns: .cursor/rules/02-convex-patterns.mdc
- Routing: .cursor/rules/03-tanstack-router.mdc
```

---

## Feature Implementation Prompt

```
From the approved PRD, implement [feature name] following these steps:

1. Update Convex schema in convex/schema.ts if needed
2. Create Convex queries/mutations in convex/[feature].ts
3. Create route at src/routes/_authenticated/[feature].tsx
4. Add navigation link to the sidebar/header
5. Implement UI with loading/error states

Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- Follow existing code patterns
- Use proper TypeScript types
- Add role-based access control (if applicable)

Reference:
- Convex patterns: .cursor/rules/02-convex-patterns.mdc
- Routing: .cursor/rules/03-tanstack-router.mdc
- Auth: .cursor/rules/04-authentication.mdc
- Multi-tenancy: .cursor/rules/05-multi-tenancy.mdc
- UI: .cursor/rules/06-ui-components.mdc
```

---

## Convex Function Prompt

```
Create Convex functions for [feature] with these requirements:

Queries needed:
- [Query 1 description]
- [Query 2 description]

Mutations needed:
- [Mutation 1 description]
- [Mutation 2 description]

Requirements:
- Use new function syntax (query({ args, handler }))
- Add proper validators for all args
- Include return validators
- Follow multi-tenancy patterns (org-scoped)
- Add proper error handling

Reference: .cursor/rules/02-convex-patterns.mdc
```

---

## Route/Page Prompt

```
Create a new route/page for [feature] at [path].

Requirements:
- Protected route (requires authentication)
- Role-based access: [which roles?]
- Data loading with Convex
- Responsive layout
- Loading and error states

Page should include:
- [UI component 1]
- [UI component 2]

Reference: .cursor/rules/03-tanstack-router.mdc
```

---

## UI Component Prompt

```
Create a [component name] component for the [feature] feature.

Requirements:
- Props interface
- Loading state
- Error handling
- Responsive design (mobile-first)
- Accessible (ARIA labels, keyboard navigation)

Style with Tailwind CSS v4 using existing project patterns.

Reference: .cursor/rules/06-ui-components.mdc
```

---

## Auth Integration Prompt

```
Implement [feature] with proper authentication:

Requirements:
- Verify user is authenticated
- Check user role: [admin/staff/client]
- Verify org membership
- [Additional access checks if needed]

Follow WorkOS AuthKit patterns for:
- Route protection
- User context in Convex functions
- Role-based UI rendering

Reference: .cursor/rules/04-authentication.mdc
```

---

## Multi-Tenancy Prompt

```
Implement [feature] with proper multi-tenancy:

Requirements:
- Data scoped to org
- Role-based data access:
  - Admin: all org data
  - Staff: assigned customers only
  - Client: own customer only
- Usage cap checks (if applicable)

Include:
- Convex functions with proper authorization
- Frontend components with access guards

Reference: .cursor/rules/05-multi-tenancy.mdc
```

---

## Billing Integration Prompt

```
Integrate Lemon Squeezy billing for [feature].

Requirements:
- Checkout flow for upgrading
- Webhook handling for subscription events
- Usage cap enforcement
- Customer portal access

Include:
- Convex mutations for subscription management
- Frontend upgrade UI
- Webhook endpoint in convex/http.ts

Reference: .cursor/rules/07-billing-integration.mdc
```

---

## Bug Fix Prompt

```
Fix this bug: [describe the issue]

Error message (if any):
```
[paste error]
```

Relevant code:
```
[paste code]
```

Expected behavior: [what should happen]
Actual behavior: [what happens instead]

Check for:
- Type errors
- Missing validators in Convex functions
- Auth context issues
- Missing loading states

Reference relevant patterns in .cursor/rules/
```

---

## Refactoring Prompt

```
Refactor [existing code] to follow iSaaSIT patterns:

Current issues:
- [Issue 1]
- [Issue 2]

Target improvements:
- Use new Convex function syntax
- Add proper TypeScript types
- Add proper error handling
- Follow feature-based folder structure
- Ensure proper auth checks

Keep existing functionality while improving code quality.

Reference: .cursor/rules/02-convex-patterns.mdc
```

---

## Schema Update Prompt

```
Update the Convex schema to support [feature].

New tables needed:
- [Table 1 with fields]
- [Table 2 with fields]

Indexes needed:
- [Index descriptions]

Relationships:
- [How tables relate]

Follow schema patterns from .cursor/rules/02-convex-patterns.mdc

After updating, explain what migration will be needed.
```

---

## Testing Prompt

```
Create a testing plan for [feature]:

Manual test cases:
1. [Test case 1]
2. [Test case 2]
3. [Test case 3]

Edge cases to consider:
- [Edge case 1]
- [Edge case 2]

Role-based scenarios:
- Admin: [expected behavior]
- Staff: [expected behavior]
- Client: [expected behavior]

Verify:
- Authentication required
- Proper data isolation
- Error handling
```

---

## Performance Optimization Prompt

```
Optimize [feature] for better performance:

Current issues:
- [Performance issue 1]
- [Performance issue 2]

Target improvements:
- Add Convex indexes for filtered queries
- Implement pagination for large lists
- Optimize React re-renders
- Use proper React Query caching

Reference:
- Convex patterns: .cursor/rules/02-convex-patterns.mdc
- Query optimization section
```

---

## Quick Task Prompts

### Add a new Convex query
```
Add a Convex query to get [data] with these requirements:
- Args: [list args]
- Returns: [what it returns]
- Should be: [public/internal]
- Access control: [who can call it]
```

### Add a new route
```
Create a new route at /[path] that:
- Requires [role] access
- Loads [data] from Convex
- Shows [UI description]
```

### Add loading states
```
Add proper loading and error states to [component].
Requirements:
- Skeleton loader while loading
- Error display with retry button
- Empty state when no data
```

### Fix TypeScript errors
```
Fix TypeScript errors in [file]:
```
[paste errors]
```
```

---

## Tips for Best Results

1. **Be specific** - Include exact file paths, function names, requirements
2. **Reference rules** - Point to relevant `.cursor/rules/*.mdc` files
3. **Provide context** - Explain what currently exists and what you need
4. **Include errors** - Paste full error messages for debugging
5. **Show examples** - Include relevant code snippets from your project

## Before Asking for Help

1. Check if a similar pattern exists in the codebase
2. Review relevant `.cursor/rules/*.mdc` files
3. Check `AGENTS.md` for project context
4. Try the development commands in `.cursor/rules/08-development-workflow.mdc`
