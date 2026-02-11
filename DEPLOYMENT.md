# Deployment Guide

Deploying iSaaSIT to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Convex Deployment](#convex-deployment)
- [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
- [Environment Configuration](#environment-configuration)
- [Custom Domains](#custom-domains)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before deploying:

1. ✅ Application runs locally without errors
2. ✅ All environment variables configured
3. ✅ WorkOS redirect URIs configured for production
4. ✅ Polar webhooks configured (if using billing)

---

## Convex Deployment

### Production Deployment

```bash
# Deploy to Convex production
npx convex deploy

# This will:
# - Bundle and deploy your functions
# - Run any pending schema changes
# - Deploy HTTP actions
```

### Preview Deployments

```bash
# Deploy to a preview environment (for PRs/testing)
npx convex deploy --preview-name my-feature

# List preview deployments
npx convex deploy --list

# Delete preview deployment
npx convex deploy --delete-preview my-feature
```

### Environment Variables in Production

```bash
# Set production secrets
npx convex env set WORKOS_CLIENT_ID client_xxx --prod
npx convex env set WORKOS_API_KEY sk_live_xxx --prod
npx convex env set POLAR_ORGANIZATION_TOKEN polar_org_xxx --prod
npx convex env set POLAR_WEBHOOK_SECRET whsec_xxx --prod
npx convex env set POLAR_SERVER production --prod

# List production env vars
npx convex env list --prod
```

> **Note**: `--prod` flag targets production deployment. Without it, sets dev environment.

---

## Frontend Deployment (Netlify)

### Option 1: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize (first time)
netlify init

# Build and deploy
netlify build
netlify deploy --prod
```

### Option 2: Git Integration (Recommended)

1. Push code to GitHub
2. Connect repo to Netlify
3. Configure build settings:

| Setting           | Value                    |
| ----------------- | ------------------------ |
| Build command     | `npm run build:combined` |
| Publish directory | `dist`                   |
| Node version      | `20` (or latest LTS)     |

### Option 3: Manual Deploy

```bash
# Build locally
npm run build

# Deploy folder
netlify deploy --prod --dir=dist
```

---

## Environment Configuration

### Production .env

Create production environment variables in Netlify:

```bash
# Via CLI
netlify env:set VITE_CONVEX_URL https://your-production.convex.cloud

# Or in Netlify Dashboard:
# Site settings → Environment variables
```

### Required Environment Variables

| Variable                 | Source                               | Set in     |
| ------------------------ | ------------------------------------ | ---------- |
| `VITE_CONVEX_URL`        | Convex dashboard → Settings → URL    | Netlify    |
| `WORKOS_REDIRECT_URI`    | Your production domain + `/callback` | .env       |
| `WORKOS_CLIENT_ID`       | WorkOS dashboard                     | Convex env |
| `WORKOS_API_KEY`         | WorkOS dashboard                     | Convex env |
| `WORKOS_COOKIE_PASSWORD` | Generate strong password             | Netlify    |

### Convex Auth Config

Ensure `convex/auth.config.ts` handles production:

```typescript
export default {
  providers: [
    {
      domain: process.env.WORKOS_DOMAIN || 'https://api.workos.com',
      applicationID: process.env.WORKOS_CLIENT_ID,
    },
  ],
};
```

---

## Netlify Configuration

### Combined Build (Main App + Docs)

The project uses a combined build process that serves both the TanStack Start app and the Astro Starlight docs from the same domain:

- `domain.com/` - Main TanStack Start app
- `domain.com/docs/` - Documentation (Astro Starlight)
- `domain.com/blog/` - Blog (redirects to `/docs/blog/`)

### netlify.toml

The `netlify.toml` is pre-configured for the combined build:

```toml
[build]
  command = "npm run build:combined"
  publish = "dist"

# Blog redirects: /blog/* -> /docs/blog/*
[[redirects]]
  from = "/blog/*"
  to = "/docs/blog/:splat"
  status = 200

[[redirects]]
  from = "/blog"
  to = "/docs/blog"
  status = 301

# SPA fallback for TanStack Start app
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Build Commands

| Command                  | Description                     |
| ------------------------ | ------------------------------- |
| `npm run build`          | Build main app only             |
| `npm run build:docs`     | Build docs only                 |
| `npm run build:combined` | Build both and merge to `dist/` |

### Git Integration Settings

When connecting to Netlify:

| Setting           | Value                    |
| ----------------- | ------------------------ |
| Build command     | `npm run build:combined` |
| Publish directory | `dist`                   |
| Node version      | `20` (or latest LTS)     |

### \_redirects File

Alternative to netlify.toml redirects:

```
# File: public/_redirects
/* /index.html 200
```

---

## WorkOS Production Setup

### Redirect URIs

Add production redirect URIs in WorkOS dashboard:

```
https://your-domain.com/callback
https://www.your-domain.com/callback
```

### Allowed Origins

Add your production domain:

```
https://your-domain.com
https://www.your-domain.com
```

---

## Polar Production Setup

### Webhook Endpoint

Set webhook URL in the Polar dashboard:

```
https://your-convex-url.convex.site/polar/events
```

> Note: Use `.convex.site` domain, not your custom domain.

Enable these events:

- product.created
- product.updated
- subscription.created
- subscription.updated

### Environment Variables

Add billing environment variables to Netlify (optional UI hints):

```bash
# Via CLI
netlify env:set VITE_POLAR_SERVER production
```

Or in Netlify Dashboard: **Site settings → Environment variables**

Add billing environment variables to Convex:

```bash
npx convex env set POLAR_ORGANIZATION_TOKEN your_organization_token
npx convex env set POLAR_WEBHOOK_SECRET your_webhook_secret
npx convex env set POLAR_SERVER production
npx convex env set POLAR_PRO_MONTHLY_PRODUCT_ID your_pro_monthly_product_id
npx convex env set POLAR_PRO_YEARLY_PRODUCT_ID your_pro_yearly_product_id
npx convex env set POLAR_BUSINESS_MONTHLY_PRODUCT_ID your_business_monthly_product_id
npx convex env set POLAR_BUSINESS_YEARLY_PRODUCT_ID your_business_yearly_product_id
```

### Product Configuration

Plan limits are configured in `src/config/billing.ts` and `convex/billing/plans.ts`. Update these files if you want different limits for each plan tier.

---

## Custom Domains

### Netlify Custom Domain

1. Buy domain or use existing
2. In Netlify: Domain settings → Add custom domain
3. Configure DNS as instructed
4. Enable HTTPS (Let's Encrypt - auto)

### Convex Custom Domain

Convex doesn't support custom domains. Use the provided `.convex.cloud` URL.

### Environment Update

After setting custom domain, update:

```bash
# Update WorkOS redirect URI in .env
WORKOS_REDIRECT_URI=https://your-domain.com/callback

# Update in WorkOS dashboard
# Update in Netlify environment variables
```

---

## Preview Deployments

### Deploy Previews

Netlify automatically creates deploy previews for pull requests.

Configure preview environment:

```bash
# In Netlify: Site settings → Build & deploy → Deploy contexts
# Enable "Deploy previews"

# Set preview environment variables
netlify env:set VITE_CONVEX_URL https://your-preview.convex.cloud --context=deploy-preview
```

### Convex Preview with Netlify Preview

For full-stack previews:

```bash
# Deploy Convex preview
npx convex deploy --preview-name pr-123

# Set Netlify preview env var to match
netlify env:set VITE_CONVEX_URL https://pr-123-your-app.convex.cloud --context=deploy-preview
```

---

## Post-Deployment Checklist

### Immediate Checks

- [ ] Homepage loads without errors
- [ ] Sign-in flow works
- [ ] Sign-out works
- [ ] Protected routes redirect when not authenticated
- [ ] Convex dashboard shows activity

### Function Checks

- [ ] Create a test customer
- [ ] Invite a test user
- [ ] Check data appears correctly
- [ ] Test role-based access

### Billing Checks (if enabled)

- [ ] Checkout flow works
- [ ] Webhooks receiving events
- [ ] Usage caps enforced
- [ ] Subscription status updates

### Performance Checks

- [ ] Lighthouse score > 90
- [ ] First contentful paint < 1.5s
- [ ] API responses < 500ms

### Security Checks

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No console errors
- [ ] Auth tokens secure

---

## Rollback

### Frontend Rollback (Netlify)

```bash
# List deploys
netlify deploys:list

# Rollback to previous deploy
netlify deploys:rollback

# Or rollback to specific deploy
netlify deploys:rollback --to=deploy-id
```

Or via Netlify dashboard:

1. Deploys tab
2. Find previous working deploy
3. Click "Publish deploy"

### Convex Rollback

Convex doesn't support rollbacks. To revert:

```bash
# Revert code in git
git revert HEAD

# Redeploy
npx convex deploy

# For schema changes, may need data migration
```

---

## Monitoring

### Convex Monitoring

```bash
# Open dashboard
npx convex dashboard

# View logs
npx convex logs
```

### Netlify Monitoring

- Netlify dashboard → Analytics
- Enable Real User Monitoring (RUM)

### Error Tracking

Consider adding:

- Sentry for error tracking
- LogRocket for session replay

---

## Troubleshooting Deployment

### "404 on refresh" or client routes

Add redirects to `netlify.toml` or `public/_redirects`.

### "Cannot find module" errors

Check build output:

```bash
npm run build
# Check dist/ folder contents
```

### Auth not working in production

Verify:

1. WorkOS redirect URIs include production domain
2. `WORKOS_REDIRECT_URI` env var is set correctly
3. Cookies are secure/samesite configured

### CORS errors

Check Convex CORS settings and Content-Security-Policy headers.

---

## Deployment Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "deploy:convex": "npx convex deploy",
    "deploy:convex:preview": "npx convex deploy --preview-name",
    "deploy:netlify": "netlify build && netlify deploy --prod",
    "deploy:all": "npm run deploy:convex && npm run deploy:netlify"
  }
}
```
