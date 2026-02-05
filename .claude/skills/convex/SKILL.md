---
name: convex
description: |
  Backend development with Convex - a reactive database platform with TypeScript support. Use when:
  - Creating or modifying Convex functions (queries, mutations, actions)
  - Defining or updating Convex schemas and indexes
  - Working with files in a convex/ directory
  - Building React apps that use useQuery, useMutation, or useAction hooks
  - Setting up real-time data subscriptions
  - Implementing file storage, scheduling, or authentication with Convex
  - Troubleshooting Convex TypeScript errors or query patterns
  Triggers: convex, useQuery, useMutation, useAction, ctx.db, v.string(), v.object(), defineSchema, defineTable
---

# Convex

Reactive backend platform with database, serverless functions, and real-time sync.

## Structure

```
convex/
├── _generated/        # Auto-generated (never edit)
├── schema.ts          # Database schema
├── http.ts            # HTTP endpoints (optional)
└── [functions].ts     # Queries, mutations, actions
```

## Function Types

| Type | Use For | DB Access | External APIs |
|------|---------|-----------|---------------|
| `query` | Read data | Yes (read) | No |
| `mutation` | Write data | Yes (read/write) | No |
| `action` | External APIs | Via runQuery/runMutation | Yes |

## Quick Patterns

### Schema

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
  }).index("by_email", ["email"]),
});
```

### Query

```typescript
export const list = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("users"), name: v.string() })),
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
```

### Mutation

```typescript
export const create = mutation({
  args: { name: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", { name: args.name });
  },
});
```

### React Usage

```tsx
const users = useQuery(api.users.list);
const createUser = useMutation(api.users.create);
```

## Critical Rules

1. **Always include `args` and `returns`** on all functions
2. **Never use `.filter()`** - define indexes, use `.withIndex()`
3. **Actions can't access `ctx.db`** - use `ctx.runQuery`/`ctx.runMutation`
4. **Keep `npx convex dev` running** - generates types

## References

- [functions.md](references/functions.md) - Complete function patterns
- [database.md](references/database.md) - Schema, indexes, queries
- [react.md](references/react.md) - React hooks and client setup
