import { Link, createFileRoute } from '@tanstack/react-router';
import { getAuth, getSignInUrl, getSignUpUrl } from '@workos/authkit-tanstack-react-start';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Building2, Users, Shield, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const { user } = await getAuth();
    const signInUrl = await getSignInUrl();
    const signUpUrl = await getSignUpUrl();

    return { user, signInUrl, signUpUrl };
  },
});

function Home() {
  const { user, signInUrl, signUpUrl } = Route.useLoaderData();

  if (user) {
    return <AuthenticatedHome />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">iSaaSIT</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="/blog">Blog</a>
            </Button>
            <ModeToggle />
            <Button variant="ghost" asChild>
              <a href={signInUrl}>Sign in</a>
            </Button>
            <Button asChild>
              <a href={signUpUrl}>Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto flex max-w-[64rem] flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              Open Source SaaS Starter Kit
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Manage your agency clients
              <br />
              <span className="text-primary">all in one place</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              iSaaSIT is a multi-tenant SaaS starter kit for agencies. 
              Manage organizations, customers, and team members with role-based access control.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <a href={signUpUrl}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://github.com/Kieransaunders/iSaaSIT" target="_blank" rel="noreferrer">
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24 bg-muted/50">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
              Everything you need to run your agency
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Building2}
                title="Multi-Tenancy"
                description="Organizations with complete data isolation. Each agency manages their own customers and team."
              />
              <FeatureCard
                icon={Users}
                title="Role-Based Access"
                description="Admins, Staff, and Client roles with scoped data access. Control who sees what."
              />
              <FeatureCard
                icon={Shield}
                title="Secure Auth"
                description="Enterprise-grade authentication powered by WorkOS AuthKit with SSO support."
              />
              <FeatureCard
                icon={CreditCard}
                title="Built-in Billing"
                description="Lemon Squeezy integration with usage-based caps and subscription management."
              />
              <FeatureCard
                icon={CheckCircle2}
                title="Type-Safe"
                description="Full TypeScript support with Convex for end-to-end type safety."
              />
              <FeatureCard
                icon={ArrowRight}
                title="Modern Stack"
                description="TanStack Start, React, Tailwind CSS, and shadcn/ui for rapid development."
              />
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-[64rem] text-center">
            <h2 className="mb-12 text-3xl font-bold tracking-tight">Built with modern technology</h2>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <TechBadge name="Convex" />
              <TechBadge name="TanStack Start" />
              <TechBadge name="WorkOS" />
              <TechBadge name="Tailwind CSS" />
              <TechBadge name="shadcn/ui" />
              <TechBadge name="Lemon Squeezy" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} iSaaSIT. Open source under MIT License.</p>
        </div>
      </footer>
    </div>
  );
}

function AuthenticatedHome() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">iSaaSIT</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="/blog">Blog</a>
            </Button>
            <ModeToggle />
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome back!</h1>
          <p className="text-muted-foreground mb-8">
            You&apos;re signed in. Continue to your dashboard to manage your agency.
          </p>
          <Button size="lg" asChild>
            <Link to="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TechBadge({ name }: { name: string }) {
  return (
    <div className="rounded-full border bg-background px-4 py-2 text-sm font-medium">
      {name}
    </div>
  );
}
