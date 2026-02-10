const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const isDev = Boolean(env?.DEV);

// Allow overriding docs/blog targets in local environments.
// Defaults are Astro Starlight dev server in development and combined build paths in production.
export const DOCS_URL = isDev ? env?.VITE_DOCS_URL || 'http://127.0.0.1:4321/docs/' : '/docs/';
export const BLOG_URL = isDev ? env?.VITE_BLOG_URL || 'http://127.0.0.1:4321/docs/blog/' : '/docs/blog/';
