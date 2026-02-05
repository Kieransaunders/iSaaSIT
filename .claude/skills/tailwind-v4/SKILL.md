---
name: tailwind-v4
description: |
  Tailwind CSS v4 styling for this project. Use when:
  - Adding or modifying component styles
  - Working with theme/design tokens (colors, spacing, radius)
  - Using responsive, dark mode, or state variants
  - Understanding the CSS-first configuration
  Triggers: className, tailwind, bg-, text-, flex, grid, p-, m-, rounded, border, shadow, dark:, hover:, app.css
---

# Tailwind CSS v4

CSS-first configuration. No `tailwind.config.js` - all config in `src/app.css`.

## Theme Tokens

Use semantic tokens, not raw colors:

| Token | Usage |
|-------|-------|
| `background` / `foreground` | Page bg/text |
| `primary` / `primary-foreground` | Primary actions |
| `muted` / `muted-foreground` | Subtle bg/secondary text |
| `destructive` | Error/danger |
| `border` / `input` / `ring` | Borders, inputs, focus |
| `card` / `popover` | Container backgrounds |
| `sidebar-*` | Sidebar-specific tokens |

## Quick Patterns

```tsx
// Semantic colors (auto dark mode)
<div className="bg-background text-foreground">
<p className="text-muted-foreground">
<button className="bg-primary text-primary-foreground hover:bg-primary/90">

// Card
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">

// Input
<input className="border border-input bg-background rounded-md px-3 py-2">

// Focus ring
<button className="focus-visible:ring-ring focus-visible:ring-[3px]">
```

## Animation (tw-animate-css)

```tsx
<div className="animate-in fade-in slide-in-from-bottom duration-300">
<div className="animate-out fade-out slide-out-to-top">
```

## Utility Function

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-classes", isActive && "active", className)}>
```

## Critical Rules

1. **Use theme tokens** - Not hardcoded colors
2. **Dark mode via `.dark` class** - Auto-switches CSS variables
3. **Config in `app.css`** - No tailwind.config.js

## References

- [tokens.md](references/tokens.md) - Full theme token reference
- [patterns.md](references/patterns.md) - Common styling patterns
