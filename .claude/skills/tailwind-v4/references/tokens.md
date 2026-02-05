# Tailwind v4 Theme Tokens

## Color Tokens

| Token | Light | Dark | Classes |
|-------|-------|------|---------|
| `background` | white | near-black | `bg-background` |
| `foreground` | near-black | near-white | `text-foreground` |
| `primary` | dark gray | light gray | `bg-primary text-primary-foreground` |
| `secondary` | light gray | dark gray | `bg-secondary text-secondary-foreground` |
| `muted` | light gray | dark gray | `bg-muted text-muted-foreground` |
| `accent` | light gray | dark gray | `bg-accent text-accent-foreground` |
| `destructive` | red | red | `bg-destructive` |
| `border` | light gray | white/10% | `border-border` |
| `input` | light gray | white/15% | `border-input` |
| `ring` | gray | gray | `ring-ring` |
| `card` | white | dark | `bg-card text-card-foreground` |
| `popover` | white | dark | `bg-popover text-popover-foreground` |

## Sidebar Tokens

`sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, `sidebar-border`, `sidebar-ring`

## Radius Scale

| Token | Value | Class |
|-------|-------|-------|
| `radius-sm` | ~6px | `rounded-sm` |
| `radius-md` | ~8px | `rounded-md` |
| `radius-lg` | 10px | `rounded-lg` |
| `radius-xl` | ~14px | `rounded-xl` |

## CSS Structure

```css
/* src/app.css */
@import 'tailwindcss';

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}

@theme inline {
  --color-background: var(--background);
  /* Maps to Tailwind utilities */
}
```

## Opacity Modifiers

```tsx
<div className="bg-primary/90">      {/* 90% */}
<div className="text-foreground/50"> {/* 50% */}
```
