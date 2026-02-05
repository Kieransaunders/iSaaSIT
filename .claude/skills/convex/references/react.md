# Convex React Integration

## Setup (Already configured in this project)

```tsx
// router.tsx
const convex = new ConvexReactClient(CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);

// In router Wrap
<ConvexProviderWithAuth client={convexQueryClient.convexClient} useAuth={useAuthFromWorkOS}>
  {children}
</ConvexProviderWithAuth>
```

## useQuery

```tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function UserList() {
  const users = useQuery(api.users.list);

  if (users === undefined) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => <li key={user._id}>{user.name}</li>)}
    </ul>
  );
}

// With args
const user = useQuery(api.users.getById, { id: userId });

// Conditional query (skip if no id)
const user = useQuery(api.users.getById, userId ? { id: userId } : "skip");
```

## useMutation

```tsx
import { useMutation } from "convex/react";

function CreateUser() {
  const create = useMutation(api.users.create);

  const handleCreate = async () => {
    const id = await create({ name: "John", email: "john@example.com" });
    console.log("Created:", id);
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

## useAction

```tsx
import { useAction } from "convex/react";

function SendEmail() {
  const sendEmail = useAction(api.emails.send);

  const handleSend = async () => {
    await sendEmail({ userId, subject: "Hello" });
  };
}
```

## With TanStack Query (this project's pattern)

```tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";

function Component() {
  // Query with TanStack Query wrapper
  const { data, isLoading, error } = useQuery(
    convexQuery(api.users.list, {})
  );

  // Mutation
  const createMutation = useConvexMutation(api.users.create);

  const handleCreate = async () => {
    await createMutation.mutateAsync({ name: "John" });
  };
}
```

## Loading States

```tsx
// undefined = loading
const users = useQuery(api.users.list);

if (users === undefined) {
  return <Skeleton />;
}

// With TanStack Query
const { data, isLoading, error } = useQuery(convexQuery(api.users.list, {}));

if (isLoading) return <Skeleton />;
if (error) return <Error error={error} />;
```

## Optimistic Updates

```tsx
const queryClient = useQueryClient();
const mutation = useConvexMutation(api.users.create, {
  onMutate: async (newUser) => {
    await queryClient.cancelQueries({ queryKey: ["users"] });
    const previous = queryClient.getQueryData(["users"]);
    queryClient.setQueryData(["users"], (old) => [...old, { ...newUser, _id: "temp" }]);
    return { previous };
  },
  onError: (err, newUser, context) => {
    queryClient.setQueryData(["users"], context.previous);
  },
});
```
