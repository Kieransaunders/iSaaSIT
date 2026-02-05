---
name: shadcn-ui
description: |
  shadcn/ui component library for this project. Use when:
  - Using or composing UI components from src/components/ui/
  - Creating new components following project patterns
  - Understanding component APIs, variants, and composition
  - Working with Radix UI primitives
  Triggers: Button, Card, Dialog, Sheet, Table, Input, Select, Tabs, Sidebar, DropdownMenu, Alert, Badge, @/components/ui
---

# shadcn/ui Components

Components built on Radix UI in `src/components/ui/`.

## Available Components

Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, Dialog, DropdownMenu, Input, Label, NavigationMenu, Popover, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Switch, Table, Tabs, Textarea, Tooltip

## Quick Patterns

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button size="icon"><Icon /></Button>
<Button asChild><Link to="/page">Link</Link></Button>
```

### Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>
    {/* content */}
    <DialogFooter><Button>Confirm</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Input

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
</div>
```

## Component Pattern

```tsx
function Component({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="component" className={cn("base-styles", className)} {...props} />
  );
}
```

## Critical Rules

1. **Import from `@/components/ui/`** - Not from Radix directly
2. **Use `cn()` for classNames** - Merges properly
3. **Use `asChild`** - To render as different element
4. **Spread `...props`** - Allows className override

## References

- [components.md](references/components.md) - Full component API reference
- [forms.md](references/forms.md) - Form patterns (Input, Select, Checkbox, etc.)
