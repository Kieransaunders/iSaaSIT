# Convex Database Reference

## Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  posts: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    published: v.boolean(),
  })
    .index("by_author", ["authorId"])
    .index("by_published", ["published"]),
});
```

## Index Rules

1. **Name convention**: `by_field` or `by_field1_and_field2`
2. **Query in order**: Can't skip fields in compound indexes
3. **Always use indexes**: Never use `.filter()` in production

## Database Operations

### Reading

```typescript
// Get by ID
const user = await ctx.db.get(userId);

// Query all
const users = await ctx.db.query("users").collect();

// Query with index
const admins = await ctx.db
  .query("users")
  .withIndex("by_role", (q) => q.eq("role", "admin"))
  .collect();

// First match
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", email))
  .first();

// With limit
const recent = await ctx.db
  .query("posts")
  .order("desc")
  .take(10);
```

### Writing

```typescript
// Insert
const id = await ctx.db.insert("users", {
  name: "John",
  email: "john@example.com",
  role: "user",
  createdAt: Date.now(),
});

// Update (partial)
await ctx.db.patch(userId, { name: "Jane" });

// Replace (full)
await ctx.db.replace(userId, { ...newData });

// Delete
await ctx.db.delete(userId);
```

## Index Queries

```typescript
// Equality
.withIndex("by_email", (q) => q.eq("email", "test@example.com"))

// Range
.withIndex("by_createdAt", (q) => q.gt("createdAt", timestamp))

// Compound
.withIndex("by_author_and_published", (q) =>
  q.eq("authorId", authorId).eq("published", true)
)
```
