# shadcn/ui Component Reference

## Button

```tsx
import { Button } from '@/components/ui/button';

// Variants: default, secondary, outline, ghost, link, destructive
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>

// Sizes: default, sm, lg, xs, icon, icon-sm, icon-xs
<Button size="sm">Small</Button>
<Button size="icon"><Icon /></Button>

// As different element
<Button asChild><Link to="/page">Link</Link></Button>
```

## Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
    <CardAction><Button size="sm">Action</Button></CardAction>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter><Button>Save</Button></CardFooter>
</Card>
```

## Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter><Button>Confirm</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

## Sheet

```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild><Button>Open</Button></SheetTrigger>
  <SheetContent side="right">
    <SheetHeader><SheetTitle>Title</SheetTitle></SheetHeader>
  </SheetContent>
</Sheet>
```

## DropdownMenu

```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Table

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell className="text-right"><Button size="sm">Edit</Button></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
  </TabsList>
  <TabsContent value="general">Content</TabsContent>
  <TabsContent value="security">Content</TabsContent>
</Tabs>
```
