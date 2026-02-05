# Starlight Components Reference

## Table of Contents
- Callouts (Asides)
- Tabs
- Cards
- Steps
- Code Blocks
- Images

## Callouts (Asides)

### Markdown Syntax

```mdx
:::note
Default informational callout.
:::

:::tip[Custom Title]
Helpful suggestion with custom title.
:::

:::caution
Something to be careful about.
:::

:::danger
Critical warning - something could break.
:::
```

### Component Syntax

```mdx
import { Aside } from '@astrojs/starlight/components';

<Aside type="note">
  Default informational callout.
</Aside>

<Aside type="tip" title="Pro Tip">
  Helpful suggestion.
</Aside>

<Aside type="caution">
  Something to be careful about.
</Aside>

<Aside type="danger">
  Critical warning.
</Aside>
```

## Tabs

```mdx
import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="npm">
    ```bash
    npm install package-name
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```bash
    pnpm add package-name
    ```
  </TabItem>
  <TabItem label="yarn">
    ```bash
    yarn add package-name
    ```
  </TabItem>
</Tabs>
```

## Cards

### Card Grid

```mdx
import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="Getting Started" icon="rocket">
    Learn the basics of setting up the project.
  </Card>
  <Card title="Configuration" icon="setting">
    Customize settings for your needs.
  </Card>
</CardGrid>
```

### Link Cards

```mdx
import { LinkCard } from '@astrojs/starlight/components';

<LinkCard
  title="Getting Started"
  description="Learn how to set up the project"
  href="/guides/quick-start/"
/>

<LinkCard
  title="API Reference"
  description="Complete API documentation"
  href="/reference/api/"
/>
```

### Staggered Cards

```mdx
<CardGrid stagger>
  <Card title="Step 1" icon="pencil">
    First step description.
  </Card>
  <Card title="Step 2" icon="add-document">
    Second step description.
  </Card>
</CardGrid>
```

## Steps

```mdx
import { Steps } from '@astrojs/starlight/components';

<Steps>
1. **Install dependencies**

   Run the install command:
   ```bash
   npm install
   ```

2. **Configure environment**

   Create a `.env` file with your settings.

3. **Start development**

   Launch the dev server:
   ```bash
   npm run dev
   ```
</Steps>
```

## Code Blocks

### Basic

````mdx
```typescript
const greeting = "Hello, World!";
console.log(greeting);
```
````

### With Title

````mdx
```typescript title="src/example.ts"
export function greet(name: string) {
  return `Hello, ${name}!`;
}
```
````

### Line Highlighting

````mdx
```typescript {2-3}
function example() {
  const highlighted = true;  // This line highlighted
  return highlighted;        // This line highlighted
}
```
````

### With Line Numbers

````mdx
```typescript showLineNumbers
const a = 1;
const b = 2;
const c = 3;
```
````

### Diff

````mdx
```typescript
- const old = "removed";
+ const new = "added";
```
````

## Images

### Relative Path

```mdx
![Alt text](./screenshot.png)
```

### From Assets

```mdx
![Logo](~/assets/logo.png)
```

### Import and Use

```mdx
import diagram from './architecture-diagram.png';

<img src={diagram.src} alt="Architecture diagram" />
```

### With Caption

```mdx
<figure>
  <img src="./screenshot.png" alt="Screenshot" />
  <figcaption>Figure 1: Application screenshot</figcaption>
</figure>
```

## File Tree

```mdx
import { FileTree } from '@astrojs/starlight/components';

<FileTree>
- src/
  - components/
    - Header.astro
    - Footer.astro
  - pages/
    - index.astro
- package.json
</FileTree>
```

## Badge

```mdx
import { Badge } from '@astrojs/starlight/components';

<Badge text="New" variant="tip" />
<Badge text="Deprecated" variant="caution" />
<Badge text="Experimental" variant="note" />
```
