# Tailwind v4 Common Patterns

## Buttons

```tsx
// Primary
<button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">

// Outline
<button className="border bg-background hover:bg-accent rounded-md px-4 py-2">

// Ghost
<button className="hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2">

// Destructive
<button className="bg-destructive text-white hover:bg-destructive/90 rounded-md px-4 py-2">
```

## Cards

```tsx
<div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
```

## Inputs

```tsx
<input className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-ring focus-visible:ring-[3px]" />
```

## Responsive

```tsx
<div className="flex flex-col md:flex-row gap-4">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<div className="hidden md:block">
<div className="p-4 md:p-6 lg:p-8">
```

## Animations (tw-animate-css)

```tsx
<div className="animate-in fade-in slide-in-from-bottom duration-300">
<div className="animate-out fade-out slide-out-to-top">

// For Radix
<div className="data-[state=open]:animate-in data-[state=closed]:animate-out">
```

## cn() Utility

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-styles",
  isActive && "bg-primary",
  className
)}>
```
