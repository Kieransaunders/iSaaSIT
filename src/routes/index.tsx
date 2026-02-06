import { Link, createFileRoute } from '@tanstack/react-router';
import { getAuth, getSignInUrl, getSignUpUrl } from '@workos/authkit-tanstack-react-start';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { BLOG_URL } from '@/lib/constants';
import { 
  Building2, Users, Shield, CreditCard, ArrowRight, CheckCircle2, 
  Zap, Lock, Code2, Sparkles, ChevronDown, Github, Twitter, 
  MessageCircle, Mail, FileText, HelpCircle, Command, Terminal,
  Database, Server, Layers
} from 'lucide-react';

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
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#code" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Code
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
            <a href={BLOG_URL} target="_blank" rel="noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
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
        <section className="container mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="mx-auto flex max-w-[64rem] flex-col items-center gap-6 text-center">
            <a 
              href="https://github.com/Kieransaunders/iSaaSIT" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
              Open Source on GitHub
              <ArrowRight className="ml-2 h-3 w-3" />
            </a>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Launch your SaaS in
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                minutes, not months
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              A free, open-source starter kit for building multi-tenant SaaS apps. 
              Authentication, billing, role-based access, and more — all pre-configured.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild className="h-12 px-8">
                <a href={signUpUrl}>
                  Start Building Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8">
                <a href="https://github.com/Kieransaunders/iSaaSIT" target="_blank" rel="noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required. MIT License.
            </p>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8">
              Built with modern, battle-tested technologies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-70">
              <TechLogo name="Convex" icon={Database} />
              <TechLogo name="TanStack" icon={Layers} />
              <TechLogo name="WorkOS" icon={Shield} />
              <TechLogo name="Tailwind" icon={Sparkles} />
              <TechLogo name="React 19" icon={Code2} />
              <TechLogo name="TypeScript" icon={Terminal} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-[64rem]">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Everything you need to run your SaaS
              </h2>
              <p className="text-lg text-muted-foreground max-w-[42rem] mx-auto">
                Stop wasting time on boilerplate. Focus on what makes your product unique.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Shield}
                title="Enterprise Auth"
                description="WorkOS AuthKit integration with SSO, social login, and magic links. Secure by default."
              />
              <FeatureCard
                icon={Building2}
                title="Multi-Tenancy"
                description="Complete data isolation between organizations. Each tenant manages their own users and data."
              />
              <FeatureCard
                icon={Users}
                title="Role-Based Access"
                description="Built-in Admin, Staff, and Client roles. Control access at the data level with Convex."
              />
              <FeatureCard
                icon={CreditCard}
                title="Usage-Based Billing"
                description="Lemon Squeezy integration with plan caps. Enforce limits and upgrade flows built-in."
              />
              <FeatureCard
                icon={Zap}
                title="Real-Time Data"
                description="Convex provides live queries that update automatically. No polling, no WebSocket setup."
              />
              <FeatureCard
                icon={Lock}
                title="Type Safety"
                description="End-to-end TypeScript with inferred types. Backend changes reflect immediately in your frontend."
              />
            </div>
          </div>
        </section>

        {/* Code Preview Section */}
        <section id="code" className="container mx-auto px-4 py-24 bg-muted/50">
          <div className="mx-auto max-w-[64rem]">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Simple, intuitive code
              </h2>
              <p className="text-lg text-muted-foreground max-w-[42rem] mx-auto">
                Get started with just a few lines. The hard parts are already solved.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <CodePreview 
                title="Define your data model"
                code={`// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  customers: defineTable({
    name: v.string(),
    orgId: v.id("organizations"),
    plan: v.string(),
  })
  .index("by_org", ["orgId"]),
});`}
              />
              <CodePreview 
                title="Query with live updates"
                code={`// React Component
import { useQuery } from "@convex-dev/react-query";

function CustomerList() {
  const customers = useQuery(
    api.customers.list
  );
  
  // Automatically re-renders 
  // when data changes!
  return (
    <ul>
      {customers?.map(c => (
        <li key={c._id}>{c.name}</li>
      ))}
    </ul>
  );
}`}
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-[64rem]">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Free forever. No catch.
              </h2>
              <p className="text-lg text-muted-foreground max-w-[42rem] mx-auto">
                iSaaSIT is open-source and free to use. You only pay for your own hosting and services.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <PricingCard
                name="Self-Hosted"
                price="Free"
                description="Everything you need to build and deploy your SaaS."
                features={[
                  "Full source code access",
                  "Multi-tenant architecture",
                  "WorkOS authentication",
                  "Convex database",
                  "Role-based access control",
                  "Billing integration ready",
                  "Community support",
                ]}
                cta="Get Started"
                href={signUpUrl}
                highlighted
              />
              <PricingCard
                name="Convex"
                price="Free"
                description="Generous free tier for getting started."
                features={[
                  "1M function calls/month",
                  "5GB storage",
                  "Real-time sync",
                  "Automatic scaling",
                  "Global CDN",
                ]}
                cta="View Pricing"
                href="https://convex.dev/pricing"
              />
              <PricingCard
                name="WorkOS"
                price="Free"
                description="Free tier for up to 1 million users."
                features={[
                  "Unlimited users (free tier)",
                  "Social login",
                  "Magic links",
                  "SSO/SAML ready",
                  "Enterprise security",
                ]}
                cta="View Pricing"
                href="https://workos.com/pricing"
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="container mx-auto px-4 py-24 border-y bg-muted/30">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-12">
              Loved by developers
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <TestimonialCard
                quote="I built and deployed my agency SaaS in a weekend. The multi-tenancy setup alone saved me weeks of work."
                author="Alex Chen"
                role="Indie Hacker"
              />
              <TestimonialCard
                quote="Finally a starter kit that gets auth right. WorkOS integration is seamless and the role-based access is exactly what I needed."
                author="Sarah Miller"
                role="Full-Stack Developer"
              />
              <TestimonialCard
                quote="The type safety with Convex is incredible. I catch bugs before they happen, and the real-time updates are magic."
                author="James Wilson"
                role="Agency Owner"
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-[48rem]">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              <FAQItem
                question="Is iSaaSIT really free?"
                answer="Yes! iSaaSIT is open-source under the MIT License. You can use it for personal and commercial projects at no cost. You only pay for your own hosting and third-party services."
              />
              <FAQItem
                question="What tech stack does it use?"
                answer="iSaaSIT uses TanStack Start for the frontend, Convex for the backend/database, WorkOS AuthKit for authentication, and Tailwind CSS with shadcn/ui for styling."
              />
              <FAQItem
                question="Can I deploy it anywhere?"
                answer="Absolutely! The frontend can be deployed to any static host (Netlify, Vercel, etc.) and Convex handles the backend. You're not locked into any platform."
              />
              <FAQItem
                question="How does multi-tenancy work?"
                answer="Each organization gets complete data isolation. We use Convex's row-level security and indexing to ensure tenants can only access their own data."
              />
              <FAQItem
                question="Is it production-ready?"
                answer="Yes! The stack includes enterprise-grade services like WorkOS and Convex that power production apps at scale. The template provides a solid foundation you can build on."
              />
              <FAQItem
                question="Can I get help if I'm stuck?"
                answer="Check out our blog for guides, read the AGENTS.md for development context, or open an issue on GitHub. The Convex and WorkOS communities are also very helpful."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-[64rem] rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to build your SaaS?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-[42rem] mx-auto">
              Join developers who are shipping faster with iSaaSIT. 
              No credit card required. Free forever.
            </p>
            <Button size="lg" variant="secondary" asChild className="h-12 px-8">
              <a href={signUpUrl}>
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold">iSaaSIT</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                A free, open-source SaaS starter kit for agencies and freelancers. 
                Built with Convex, TanStack Start, and WorkOS.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href={BLOG_URL} className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="https://github.com/Kieransaunders/iSaaSIT" className="hover:text-foreground transition-colors">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={DOCS_URL} className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="https://docs.convex.dev" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Convex Docs</a></li>
                <li><a href="https://workos.com/docs" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">WorkOS Docs</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} iSaaSIT. Open source under MIT License.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/Kieransaunders/iSaaSIT" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
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
              <a href={BLOG_URL} target="_blank" rel="noreferrer">Blog</a>
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
            You're signed in. Continue to your dashboard to manage your workspace.
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

// Component helpers
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
    <div className="group relative rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function TechLogo({ name, icon: Icon }: { name: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-5 w-5" />
      <span className="font-medium">{name}</span>
    </div>
  );
}

function CodePreview({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
        <span className="text-sm font-medium">{title}</span>
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
          <div className="h-3 w-3 rounded-full bg-green-400/80" />
        </div>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code className="text-muted-foreground font-mono">{code}</code>
      </pre>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  href,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border p-6 ${highlighted ? 'border-primary shadow-lg' : 'shadow-sm'}`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            Recommended
          </span>
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-bold">{price}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full" variant={highlighted ? 'default' : 'outline'} asChild>
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>
          {cta}
        </a>
      </Button>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
      <p className="text-muted-foreground mb-4 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-semibold text-sm">{author}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
    </div>
  );
}
