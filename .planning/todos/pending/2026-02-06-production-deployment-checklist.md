---
created: 2026-02-06T15:40
title: Production deployment checklist
area: devops
priority: high
---

## Production Deployment Checklist

### Netlify Environment Variables
- [ ] `VITE_CONVEX_URL` = `https://loyal-canary-889.convex.cloud`
- [ ] `WORKOS_CLIENT_ID` = your WorkOS client ID
- [ ] `WORKOS_API_KEY` = your WorkOS API key
- [ ] `WORKOS_COOKIE_PASSWORD` = your cookie password (min 32 chars)
- [ ] `WORKOS_REDIRECT_URI` = `https://isaasit.netlify.app/callback`

### WorkOS Dashboard
- [ ] Add `https://isaasit.netlify.app/callback` as redirect URI (in Staging environment)
- [ ] Verify staging API keys work with Netlify deployment
- [ ] (Later) Add billing info to WorkOS to enable Production environment
- [ ] (Later) Switch from `sk_test_*` to production API key when ready for real customers

### Convex
- [x] Production deployment created: `loyal-canary-889`
- [x] Schema and functions pushed to production
- [ ] Verify production Convex dashboard has correct data/indexes

### Netlify
- [x] Code pushed to GitHub (16 commits)
- [x] `NODE_VERSION=22` pinned in `netlify.toml`
- [ ] Clear the `Functions directory: netlify/functions` setting in Netlify UI (set to blank)
- [ ] Trigger "Clear cache and deploy site" after env vars are set
- [ ] Verify deploy log shows `Wrote SSR entry point to .netlify/v1/functions/server.mjs`
- [ ] Verify deploy log shows `Packaging Functions from .netlify directory`
- [ ] Verify deploy shows `1 new function(s) to upload` (not 0)
- [ ] Verify site loads at https://isaasit.netlify.app/

### Post-Deploy Verification
- [ ] Homepage loads (not 404)
- [ ] Sign up flow works (redirects to WorkOS)
- [ ] Callback URL works (returns to app after auth)
- [ ] Dashboard loads for authenticated users
- [ ] Docs site works at /docs/
- [ ] Blog works at /blog/
