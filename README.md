# iSaaSIT 🚀

**A free, open-source SaaS starter kit for agencies and freelancers. Built with Convex, TanStack Start, and WorkOS AuthKit.**

![iSaaSIT Homepage](screenshots/homepage.png)

## What's inside?

This template gives you everything you need to launch a multi-tenant SaaS in record time:

✅ **Fully open-source** - No proprietary code, completely free to use and modify  
✅ **Multi-tenant architecture** - Manage multiple clients with proper data isolation  
✅ **Authentication ready** - Enterprise-grade auth with WorkOS AuthKit + social login  
✅ **Role-based access** - Admin, Staff, and Client roles built-in  
✅ **Modern stack** - React 19, TanStack Start, Convex, Tailwind CSS v4  
✅ **Type-safe** - End-to-end TypeScript with inferred types from backend to frontend  
✅ **AI-Ready** - Cursor rules, Claude Code skills, and GSD integration for AI-assisted development

> **🎨 New:** 6 Claude Code skills now bundled in the repo, including **ui-ux-pro-max** for instant design system generation (50+ styles, 97 palettes, 57 font pairings). Use `/ui-ux-pro-max`, `/convex`, `/tanstack` and more - no setup required!

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [TanStack Start](https://tanstack.com/start) for modern full-stack React with file-based routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI
- [WorkOS AuthKit](https://authkit.com/) for authentication

## Get started

### Quick Setup (Recommended)

```bash
# Clone and install
git clone <repository-url>
cd iSaaSIT
npm install

# Run the setup wizard
npm run setup
```

The setup wizard will guide you through:
- Environment configuration
- WorkOS AuthKit setup
- Convex backend configuration
- GSD (Get Shit Done) installation for AI-assisted development

### Manual Setup

If you prefer to set up manually:

1. Install dependencies:

   ```bash
   npm install
   ```

   > **Note:** After `npm install`, you'll be prompted to install GSD (Get Shit Done) - a meta-prompting system for AI-assisted development. This is optional but recommended.

2. Set up your environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

3. Configure WorkOS AuthKit:
   - Create a [WorkOS account](https://workos.com/)
   - Get your Client ID and API Key from the WorkOS dashboard
   - In the WorkOS dashboard, add `http://localhost:3000/callback` as a redirect URI
   - Generate a secure password for cookie encryption (minimum 32 characters)
   - Update your `.env.local` file with these values

4. Configure Convex:

   ```bash
   npx convex dev
   ```

   This will:
   - Set up your Convex deployment
   - Add your Convex URL to `.env.local`
   - Open the Convex dashboard

   Then set your WorkOS Client ID in Convex:

   ```bash
   npx convex env set WORKOS_CLIENT_ID <your_client_id>
   ```

   This allows Convex to validate JWT tokens from WorkOS

5. Run the development server:

   ```bash
   npm run dev
   ```

   This starts both the Vite dev server (TanStack Start frontend) and Convex backend in parallel

6. Open [http://localhost:3000](http://localhost:3000) to see your app

## AI-Assisted Development

This project is optimized for AI-assisted development with comprehensive documentation and tooling support for coding assistants like Claude Code and Cursor.

### 📁 AI Developer Resources

| Document | Purpose |
|----------|---------|
| **`LLM.txt`** | Quick context for any LLM - start here |
| **`AGENTS.md`** | Comprehensive project documentation and patterns |
| **`.cursor/rules/*.mdc`** | Contextual coding rules for Cursor IDE |
| **`.cursor/example-prompts.md`** | Copy-paste prompts for common tasks |
| **`docs/CONVEX_LLMS.md`** | Local copy of Convex LLM documentation |
| **`.claude/skills/*/`** | Specialized skills for Claude Code |

### 🤖 Claude Code Skills (Bundled & Ready)

**All skills are pre-installed in `.claude/skills/`** - no setup required. Just use slash commands like `/convex`, `/ui-ux-pro-max`, or `/tanstack` in Claude Code.

| Skill | Slash Command | Description |
|-------|---------------|-------------|
| `convex/` | `/convex` | Backend development patterns with Convex |
| `tanstack/` | `/tanstack` | TanStack Start, Router, and Query patterns |
| `tailwind-v4/` | `/tailwind-v4` | Tailwind CSS v4 styling and theming |
| `shadcn-ui/` | `/shadcn-ui` | shadcn/ui component usage |
| `astro-starlight/` | `/astro-starlight` | Documentation site development |
| `ui-ux-pro-max/` | `/ui-ux-pro-max` | Complete design system generator with 50+ styles, 97 color palettes, 57 font pairings, 99 UX guidelines |

**New in this release:** The **ui-ux-pro-max** skill (from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)) is now bundled, giving you instant access to comprehensive design intelligence for building beautiful, accessible UIs.

### 🎯 GSD (Get Shit Done)

A meta-prompting system for spec-driven development:

```bash
npm run setup:gsd
# Or manually: npx get-shit-done-cc@latest --claude --local
```

| Command | Purpose |
|---------|---------|
| `/gsd:map-codebase` | Analyze existing code structure |
| `/gsd:new-project` | Initialize spec-driven development |
| `/gsd:plan-phase 1` | Create execution plans |
| `/gsd:execute-phase 1` | Build features with fresh context |
| `/gsd:verify-phase 1` | Verify implementation |

**Learn more**: [github.com/glittercowboy/get-shit-done](https://github.com/glittercowboy/get-shit-done)

## WorkOS AuthKit Setup

This app uses WorkOS AuthKit for authentication. Key features:

- **Redirect-based authentication**: Users are redirected to WorkOS for sign-in/sign-up
- **Session management**: Automatic token refresh and session handling
- **Route loader protection**: Protected routes use loaders to check authentication
- **Client and server functions**: `useAuth()` for client components, `getAuth()` for server loaders

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
