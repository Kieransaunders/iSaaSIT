---
name: astro-starlight
description: |
  Astro Starlight documentation site in docs-site/. Use when:
  - Adding or editing documentation pages (MDX files)
  - Modifying sidebar navigation in astro.config.mjs
  - Using Starlight components (Aside, Tabs, Cards, Steps)
  - Understanding docs structure and conventions
  Triggers: docs, documentation, mdx, starlight, astro, docs-site, guides, reference
---

# Astro Starlight Documentation

Documentation site in `docs-site/` using Astro Starlight.

## Structure

```
docs-site/
├── astro.config.mjs     # Sidebar + site config
├── src/content/docs/    # MDX pages
│   ├── index.mdx
│   ├── guides/
│   ├── features/
│   ├── development/
│   └── reference/
```

## Quick Patterns

### New Page

```mdx
---
title: Page Title
description: Brief description for SEO
---

Content here. Use Markdown + components.

## Section

More content...
```

### Add to Sidebar

In `astro.config.mjs`:
```js
sidebar: [
  {
    label: 'Getting Started',
    items: [
      { label: 'New Page', slug: 'guides/new-page' },
    ],
  },
]
```

### Callouts

```mdx
:::note
Informational note.
:::

:::tip[Pro Tip]
Helpful suggestion.
:::

:::caution
Be careful about this.
:::
```

## Commands

```bash
npm run dev:docs     # Start at localhost:4321
npm run build:docs   # Build static site
```

## Critical Rules

1. **Slug = path** - `guides/intro.mdx` → slug: `guides/intro`
2. **Frontmatter required** - `title` and `description`
3. **No .mdx in slugs** - Just the path

## References

- [components.md](references/components.md) - Starlight components (Tabs, Cards, Steps)
- [config.md](references/config.md) - Sidebar and site configuration
