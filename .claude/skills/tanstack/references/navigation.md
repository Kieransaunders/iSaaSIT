# TanStack Router - Navigation

## Link Component

```tsx
import { Link } from '@tanstack/react-router';

<Link to="/dashboard">Dashboard</Link>

<Link to="/customers/$customerId" params={{ customerId: '123' }}>
  View Customer
</Link>

<Link to="/customers" search={{ page: 2, filter: 'active' }}>
  Filtered
</Link>

<Link
  to="/dashboard"
  activeProps={{ className: 'font-bold' }}
>
  Dashboard
</Link>
```

## Programmatic Navigation

```tsx
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();

navigate({ to: '/dashboard' });
navigate({ to: '/customers/$customerId', params: { customerId: '123' } });
navigate({ to: '/page', replace: true });
```

## URL Parameters

```tsx
import { useParams } from '@tanstack/react-router';

const { customerId } = useParams({ from: '/customers/$customerId' });
// Or inside route component:
const params = Route.useParams();
```

## Search Parameters

```tsx
// Define schema
export const Route = createFileRoute('/customers')({
  validateSearch: z.object({
    page: z.number().default(1),
    filter: z.string().optional(),
  }),
});

// Access
const { page, filter } = Route.useSearch();

// Update
navigate({
  to: '/customers',
  search: (prev) => ({ ...prev, page: prev.page + 1 }),
});
```
