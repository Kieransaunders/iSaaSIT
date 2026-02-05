# Convex Functions Reference

## Query

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("users"), name: v.string() })),
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  returns: v.union(v.null(), v.object({ _id: v.id("users"), name: v.string() })),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// With index
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});
```

## Mutation

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { name: v.string(), email: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
  },
});

export const update = mutation({
  args: { id: v.id("users"), name: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
```

## Action

```typescript
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const sendEmail = action({
  args: { userId: v.id("users"), subject: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getById, { id: args.userId });

    await fetch("https://api.email.com/send", {
      method: "POST",
      body: JSON.stringify({ to: user.email, subject: args.subject }),
    });

    return null;
  },
});
```

For Node.js APIs, add `"use node";` at the top.

## Validators

| Type | Validator |
|------|-----------|
| String | `v.string()` |
| Number | `v.number()` |
| Boolean | `v.boolean()` |
| ID | `v.id("table")` |
| Optional | `v.optional(v.string())` |
| Array | `v.array(v.string())` |
| Object | `v.object({ name: v.string() })` |
| Union | `v.union(v.literal("a"), v.literal("b"))` |
| Literal | `v.literal("admin")` |
| Null | `v.null()` |
| Any | `v.any()` |
