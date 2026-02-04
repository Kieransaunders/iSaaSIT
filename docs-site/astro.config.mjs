// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  base: '/blog',
  integrations: [
    starlight({
      title: 'iSaaSIT Documentation',
      description: 'Documentation for iSaaSIT - Open source SaaS starter kit for agencies',
      logo: {
        src: './src/assets/houston.webp',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/workos/template-convex-tanstack-start-authkit' },
      ],
      topnav: [
        { label: 'Docs', link: '/blog/guides/introduction/' },
        { label: 'Blog', link: '/blog/blog/' },
      ],
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
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
