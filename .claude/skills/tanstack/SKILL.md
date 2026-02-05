---
name: tanstack
description: |
  TanStack Start, Router, and Query for full-stack React with SSR. Use when:
  - Creating or modifying routes in src/routes/
  - Working with file-based routing, loaders, or layouts
  - Using React Query with Convex integration
  - Server functions (createServerFn) or SSR patterns
  - Authentication guards and redirects
  Triggers: createFileRoute, createServerFn, useLoaderData, loader, beforeLoad, Outlet, Link, useNavigate, routeTree, __root
---

# TanStack (Start + Router + Query)

Full-stack React framework with file-based routing, SSR, and React Query + Convex integration.

## Structure

```
src/
├── router.tsx           # Router setup with Convex + WorkOS
├── routeTree.gen.ts     # Auto-generated (never edit)
└── routes/
    ├── __root.tsx       # Root layout, providers, head
    ├── index.tsx        # Landing page (/)
    ├── _authenticated.tsx  # Auth guard layout
    └── _authenticated/     # Protected routes
```

## Quick Patterns

### Basic Route

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: async ({ context }) => {
    return { data: await context.convexQueryClient.fetchQuery(api.items.list, {}) };
  },
  component: () => {
    const { data } = Route.useLoaderData();
    return <div>{/* render */}</div>;
  },
});
```

### Server Function

```tsx
import { createServerFn } from '@tanstack/react-start';
import { getAuth } from '@workos/authkit-tanstack-react-start';

const getUser = createServerFn({ method: 'GET' }).handler(async () => {
  const { user } = await getAuth();
  return user;
});
```

### Auth Guard

```tsx
// _authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  loader: async () => {
    const { user } = await getAuth();
    if (!user) throw redirect({ href: await getSignInUrl() });
    return { user };
  },
  component: () => <MainLayout><Outlet /></MainLayout>,
});
```

## Critical Rules

1. **Never edit `routeTree.gen.ts`** - auto-generated
2. **Path must match file** - `createFileRoute('/_authenticated/dashboard')` for `routes/_authenticated/dashboard.tsx`
3. **Redirect with throw** - `throw redirect({ href })`, not return
4. **Run `npm run dev`** - generates route tree automatically

## References

- [routing.md](references/routing.md) - File conventions, layouts, dynamic routes
- [loaders.md](references/loaders.md) - Data loading, context, SSR patterns
- [navigation.md](references/navigation.md) - Links, params, search params
