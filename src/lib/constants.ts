// URLs for external resources
export const BLOG_URL = import.meta.env.DEV
  ? 'http://localhost:4321/blog'
  : '/docs/blog'; // Combined build serves blog at /docs/blog

export const DOCS_URL = import.meta.env.DEV
  ? 'http://localhost:4321'
  : '/docs'; // Combined build serves docs at /docs
