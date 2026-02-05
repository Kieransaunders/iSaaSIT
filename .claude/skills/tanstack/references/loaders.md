# TanStack Router - Data Loading & SSR

## Loader Basics

```tsx
export const Route = createFileRoute('/customers')({
  loader: async ({ context, params }) => {
    const data = await context.convexQueryClient.fetchQuery(api.customers.list, {});
    return { customers: data };
  },
  component: () => {
    const { customers } = Route.useLoaderData();
    return <div>{/* render */}</div>;
  },
});
```

## beforeLoad vs loader

| Hook | When | Use For |
|------|------|---------|
| `beforeLoad` | First | Auth checks, redirects, setup |
| `loader` | After beforeLoad | Data fetching |

```tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { user } = await getAuth();
    if (!user) throw redirect({ href: await getSignInUrl() });
    return { user };
  },
  loader: async ({ context }) => {
    return { data: await fetchMore() };
  },
});
```

## Server Functions

```tsx
import { createServerFn } from '@tanstack/react-start';

const getData = createServerFn({ method: 'GET' }).handler(async () => {
  // Server-only code
  return { data: await serverOnlyFetch() };
});

// With validation
const updateItem = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return { success: true };
  });
```

## React Query + Convex

```tsx
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';

const { data } = useQuery(convexQuery(api.customers.list, {}));
const mutation = useConvexMutation(api.customers.create);
```
