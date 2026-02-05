# TanStack Router - File Conventions & Routing

## Route File Naming

| Pattern | URL | Example |
|---------|-----|---------|
| `index.tsx` | Directory index | `routes/index.tsx` → `/` |
| `about.tsx` | Static segment | `routes/about.tsx` → `/about` |
| `$param.tsx` | Dynamic segment | `routes/$userId.tsx` → `/123` |
| `_layout.tsx` | Layout (no URL) | `routes/_authenticated.tsx` |
| `__root.tsx` | Root layout | `routes/__root.tsx` |

## Layout Routes

```tsx
// routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <div className="layout">
      <Sidebar />
      <main><Outlet /></main>
    </div>
  ),
});
```

Child routes in `_authenticated/` inherit this layout.

## Dynamic Routes

```tsx
// routes/_authenticated/customers/$customerId.tsx
export const Route = createFileRoute('/_authenticated/customers/$customerId')({
  loader: async ({ params }) => {
    return { customer: await fetchCustomer(params.customerId) };
  },
});
```

## Root Route

```tsx
// routes/__root.tsx
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    links: [{ rel: 'stylesheet', href: appCssUrl }],
  }),
  component: RootComponent,
});
```
