# iSaaSIT Setup Guide

This guide walks you through setting up iSaaSIT from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [WorkOS AuthKit Setup](#workos-authkit-setup)
3. [Convex Setup](#convex-setup)
4. [Environment Variables](#environment-variables)
5. [First Run](#first-run)
6. [Optional: Billing Setup](#optional-billing-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:

- **Node.js 22+** - [Download here](https://nodejs.org/)
- **npm** or **pnpm** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **A code editor** - VS Code recommended with the following extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Convex

---

## WorkOS AuthKit Setup

### 1. Create WorkOS Account

1. Go to [dashboard.workos.com](https://dashboard.workos.com/) and sign up
2. Create a new project (e.g., "My Agency Portal")
3. Note down your **Client ID** (looks like `client_xxx`)
4. Create an API Key (looks like `sk_test_xxx`)

### 2. Configure Redirect URIs

1. In WorkOS dashboard, go to **Authentication** → **Redirect URIs**
2. Add these URIs:
   - `http://localhost:3000/callback` (for development)
   - `https://your-production-domain.com/callback` (for production)

### 3. Generate Cookie Password

The cookie password must be at least 32 characters:

```bash
openssl rand -base64 32
```

Save this output for the next step.

---

## Convex Setup

### 1. Initialize Convex

```bash
npx convex dev
```

This will:
- Sign you into Convex (opens browser)
- Create a new Convex project
- Add `VITE_CONVEX_URL` to your `.env.local`
- Start the Convex development server

### 2. Set WorkOS Client ID in Convex

Convex needs to validate JWT tokens from WorkOS:

```bash
npx convex env set WORKOS_CLIENT_ID client_xxx
```

Replace `client_xxx` with your actual WorkOS Client ID.

### 3. Set WorkOS Secrets in Convex (Required)

These are required for Convex actions and WorkOS webhooks:

```bash
# Development
npx convex env set WORKOS_API_KEY sk_test_xxx
npx convex env set WORKOS_WEBHOOK_SECRET wh_secret_xxx

# Production
npx convex env set WORKOS_API_KEY sk_live_xxx --prod
npx convex env set WORKOS_WEBHOOK_SECRET wh_secret_xxx --prod
```

Replace the values with your WorkOS API key and webhook secret.

### 4. Verify Convex is Running

You should see:
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

In your `.env.local` file.

---

## Environment Variables

Create your environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```bash
# WorkOS AuthKit Configuration
WORKOS_CLIENT_ID=client_your_client_id_here
WORKOS_API_KEY=sk_test_your_api_key_here
WORKOS_WEBHOOK_SECRET=wh_secret_your_webhook_secret_here
WORKOS_COOKIE_PASSWORD=your_generated_password_here
WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Convex Configuration (auto-populated by npx convex dev)
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

---

## First Run

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

This starts:
- Vite dev server at http://localhost:3000
- Convex backend (already running from `npx convex dev`)

### 3. Create Your First User

1. Open http://localhost:3000
2. Click "Get Started" to sign up
3. You'll be redirected to WorkOS AuthKit
4. Complete sign-up with email or social login

### 4. Create Your Organization

After signing in, you'll be prompted to create your organization:

1. Enter your agency/company name
2. Enter a billing email
3. Click "Create Organization"

You'll be redirected to your new dashboard! 🎉

### 5. Invite Your Team

1. Go to **Team** in the sidebar
2. Click "Invite Member"
3. Enter email and select role (Staff/Client)
4. Send invitation

---

## Optional: Billing Setup

To enable paid plans, follow these additional steps:

### 1. Create Lemon Squeezy Account

1. Sign up at [app.lemonsqueezy.com](https://app.lemonsqueezy.com)
2. Complete store setup
3. Get your store slug (from Settings → Store)

### 2. Create Products

1. Go to **Products** → **Create Product**
2. Create "Pro Plan":
   - Name: "Pro"
   - Price: $29/month
   - Create a variant
3. Create "Business Plan":
   - Name: "Business"  
   - Price: $99/month
   - Create a variant

### 3. Get Variant IDs

For each variant:
1. Click on the variant in Lemon Squeezy
2. Look at the URL: `https://app.lemonsqueezy.com/products/12345/variants/67890`
3. The variant ID is the last number (e.g., `67890`)

### 4. Add to Environment

```bash
# .env.local
VITE_LEMONSQUEEZY_STORE_SLUG=your-store-slug
VITE_LEMONSQUEEZY_PRO_VARIANT_ID=12345
VITE_LEMONSQUEEZY_BUSINESS_VARIANT_ID=67890
```

### 5. Configure Webhooks

1. In Lemon Squeezy, go to **Settings** → **Webhooks**
2. Add webhook endpoint:
   - URL: `https://your-convex-deployment.convex.site/lemonsqueezy/webhook`
   - Events: Select all subscription events
3. Copy the webhook signing secret

### 6. Add Convex Environment Variables

```bash
npx convex env set LEMONSQUEEZY_API_KEY your_api_key
npx convex env set LEMONSQUEEZY_WEBHOOK_SECRET your_webhook_secret
npx convex env set LEMONSQUEEZY_PRO_VARIANT_ID your_pro_variant_id
npx convex env set LEMONSQUEEZY_BUSINESS_VARIANT_ID your_business_variant_id
```

These variant IDs should match the `VITE_LEMONSQUEEZY_*_VARIANT_ID` values in your `.env.local`.

### 7. Test Billing

1. Go to **Billing** in your app
2. You should see plan options
3. Click "Upgrade" to test checkout flow
4. Use Lemon Squeezy test card: `4242 4242 4242 4242`

---

## Troubleshooting

### Authentication Issues

**"Authentication failed" error:**
- Check `WORKOS_CLIENT_ID` matches in both `.env.local` and Convex
- Verify redirect URI in WorkOS dashboard matches exactly
- Check browser console for specific error messages

**"User not associated with organization":**
- This is normal for new users
- Complete the onboarding flow to create an org

### Convex Issues

**"Missing VITE_CONVEX_URL":**
- Run `npx convex dev` again
- Check that `.env.local` was created

**"Convex function not found":**
- Ensure Convex is running: `npx convex dev`
- Check that functions are deployed: `npx convex dev` should show "Deploying..."

### Billing Issues

**"Billing is not configured" warning:**
- This is expected if you haven't set up Lemon Squeezy
- The app works fully without billing (free tier)

**"Unable to start checkout":**
- Check `VITE_LEMONSQUEEZY_STORE_SLUG` is set
- Verify variant IDs are correct
- Check browser console for errors

### General Issues

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Node version issues:**
```bash
# Check Node version
node --version  # Should be 22+

# Use nvm to switch versions
nvm use 22
```

---

## Next Steps

Now that you're set up:

1. **Customize the branding** - Update logo, colors in `src/app.css`
2. **Add your features** - Build on top of the existing architecture
3. **Deploy to production** - See [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Read the docs** - Check out `docs/` for more detailed guides

---

Need help? [Open an issue](https://github.com/Kieransaunders/iSaaSIT/issues) on GitHub.
