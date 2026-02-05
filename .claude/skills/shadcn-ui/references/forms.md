# Form Components

## Input

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
</div>
```

## Textarea

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea placeholder="Message..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
```

## Select

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

## Checkbox

```tsx
import { Checkbox } from '@/components/ui/checkbox';

<div className="flex items-center gap-2">
  <Checkbox id="terms" checked={checked} onCheckedChange={setChecked} />
  <Label htmlFor="terms">Accept terms</Label>
</div>
```

## Switch

```tsx
import { Switch } from '@/components/ui/switch';

<div className="flex items-center gap-2">
  <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

## Error States

```tsx
<Input aria-invalid={!!error} />
{error && <p className="text-sm text-destructive">{error}</p>}
```
