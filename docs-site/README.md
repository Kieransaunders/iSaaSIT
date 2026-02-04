# iSaaSIT Documentation

This is the documentation site for iSaaSIT, built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build/).

## Features

- 📚 **Documentation** - Comprehensive guides and API reference
- 📝 **Blog** - Tutorials, updates, and best practices (via starlight-blog)
- 🎨 **Tailwind CSS** - Utility-first styling
- 🌙 **Dark mode** - Built-in theme switching
- 📱 **Responsive** - Works on all devices

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

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repo to Netlify
2. Set build settings:
   - Base directory: `docs-site`
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Deploy!

### Vercel

```bash
cd docs-site
vercel --prod
```

### Custom Domain

Update the `site` URL in `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://docs.yourdomain.com',
  // ...
});
```

## Writing Documentation

### Adding a Doc Page

1. Create a new `.mdx` file in `src/content/docs/`
2. Add frontmatter:
   ```yaml
   ---
   title: Page Title
   description: Brief description
   ---
   ```
3. Write your content using Markdown/MDX

### Adding a Blog Post

1. Create a new `.mdx` file in `src/content/docs/blog/`
2. Add frontmatter:
   ```yaml
   ---
   title: Post Title
   description: Brief description
   date: 2026-02-04
   authors:
     - kieran
   ---
   ```
3. Write your post

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
- [Starlight Blog Plugin](https://github.com/HiDeoo/starlight-blog)
- [Astro Documentation](https://docs.astro.build)
