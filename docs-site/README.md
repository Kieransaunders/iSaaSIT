# iSaaSIT Documentation

This is the documentation site for iSaaSIT, built with [Starlight](https://starlight.astro.build/).

## Development

From the `docs-site` directory:

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Or from the project root:

```bash
# Start docs dev server
npm run dev:docs
```

The dev server will start at `http://localhost:4321`.

## Building

```bash
# Build the docs
npm run build:docs

# Preview the build
npm run preview:docs
```

## Writing Documentation

Documentation files are in `src/content/docs/` as MDX files.

### Adding a Page

1. Create a new `.mdx` file in the appropriate directory
2. Add frontmatter:
   ```yaml
   ---
   title: Page Title
   description: Brief description
   ---
   ```
3. Write your content using Markdown/MDX

### Sidebar Navigation

Edit `astro.config.mjs` to update the sidebar:

```javascript
sidebar: [
  {
    label: 'Section Name',
    items: [
      { label: 'Page Label', slug: 'path/to/page' },
    ],
  },
],
```

## Learn More

- [Starlight Documentation](https://starlight.astro.build/)
- [Astro Documentation](https://docs.astro.build)
