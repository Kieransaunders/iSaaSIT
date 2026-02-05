# Starlight Configuration Reference

## Table of Contents
- Site Configuration
- Sidebar Configuration
- Frontmatter Options

## Site Configuration

`docs-site/astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  server: {
    port: 4321,
  },
  integrations: [
    starlight({
      title: 'Site Title',
      description: 'Site description for SEO',
      logo: {
        src: './src/assets/logo.png',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/...' },
      ],
      sidebar: [
        // Sidebar config here
      ],
    }),
  ],
});
```

## Sidebar Configuration

### Manual Items

```js
sidebar: [
  {
    label: 'Getting Started',
    items: [
      { label: 'Introduction', slug: 'guides/introduction' },
      { label: 'Quick Start', slug: 'guides/quick-start' },
      { label: 'Architecture', slug: 'guides/architecture' },
    ],
  },
  {
    label: 'Features',
    items: [
      { label: 'Authentication', slug: 'features/authentication' },
      { label: 'Organizations', slug: 'features/organizations' },
    ],
  },
]
```

### Auto-Generated from Directory

```js
sidebar: [
  {
    label: 'Features',
    autogenerate: { directory: 'features' },
  },
]
```

### External Links

```js
sidebar: [
  {
    label: 'Resources',
    items: [
      { label: 'GitHub', link: 'https://github.com/...' },
      { label: 'Discord', link: 'https://discord.gg/...' },
    ],
  },
]
```

### Collapsed Groups

```js
sidebar: [
  {
    label: 'Advanced',
    collapsed: true,
    items: [
      { label: 'Custom Themes', slug: 'advanced/themes' },
      { label: 'Plugins', slug: 'advanced/plugins' },
    ],
  },
]
```

### With Badges

```js
sidebar: [
  {
    label: 'Features',
    items: [
      { label: 'New Feature', slug: 'features/new', badge: 'New' },
      { label: 'Beta Feature', slug: 'features/beta', badge: { text: 'Beta', variant: 'caution' } },
    ],
  },
]
```

## Frontmatter Options

### Required

```yaml
---
title: Page Title
description: Brief description for SEO and social sharing
---
```

### Sidebar Override

```yaml
---
title: Full Page Title
description: Description
sidebar:
  label: Short Label      # Override sidebar text
  order: 1                # Sort order (lower = higher)
  badge: New              # Show badge
  hidden: false           # Hide from sidebar
---
```

### Table of Contents

```yaml
---
title: Page Title
description: Description
tableOfContents: false    # Hide TOC
# or
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 4
---
```

### Hero (Landing Pages)

```yaml
---
title: Welcome
description: Landing page
template: splash
hero:
  title: Project Name
  tagline: A brief description of the project
  image:
    file: ../../assets/hero.png
  actions:
    - text: Get Started
      link: /guides/introduction/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/...
      icon: external
---
```

### Banner

```yaml
---
title: Page Title
description: Description
banner:
  content: |
    This page is a work in progress.
    <a href="/contribute">Help us improve it!</a>
---
```

### Pagination

```yaml
---
title: Page Title
description: Description
prev: false                 # Disable prev link
next:
  link: /next-page/
  label: Custom Next Label
---
```

## Current Project Sidebar

```js
sidebar: [
  {
    label: 'Getting Started',
    items: [
      { label: 'Introduction', slug: 'guides/introduction' },
      { label: 'Quick Start', slug: 'guides/quick-start' },
      { label: 'Architecture', slug: 'guides/architecture' },
    ],
  },
  {
    label: 'Features',
    items: [
      { label: 'Authentication', slug: 'features/authentication' },
      { label: 'Organizations', slug: 'features/organizations' },
      { label: 'Customer Management', slug: 'features/customers' },
      { label: 'Role-Based Access', slug: 'features/rbac' },
      { label: 'Billing', slug: 'features/billing' },
    ],
  },
  {
    label: 'Development',
    items: [
      { label: 'Project Structure', slug: 'development/structure' },
      { label: 'Convex Backend', slug: 'development/convex' },
      { label: 'Frontend Guide', slug: 'development/frontend' },
      { label: 'Environment Setup', slug: 'development/environment' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { label: 'API Reference', slug: 'reference/api' },
      { label: 'Convex LLM Reference', slug: 'reference/llms' },
    ],
  },
]
```
