import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  GitBranch,
  MessageSquare,
  Repeat,
  Shield,
  Terminal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WaitlistForm } from '@/components/landing/waitlist-form';

export const metadata: Metadata = {
  title: 'CodeMentor — AI Mentor That Teaches You to Think Like a Developer',
  description:
    'Learn web development through hands-on projects with an AI mentor that uses Socratic questioning. No hand-holding, no copy-paste — real understanding.',
};

function TerminalMockup() {
  return (
    <div className="terminal-glow overflow-hidden rounded-lg border border-border/50 bg-[#0a0a0f] text-sm">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="ml-2 font-mono text-xs text-white/30">~/projects</span>
      </div>
      {/* Terminal content */}
      <div className="space-y-3 p-4 font-mono text-[13px] leading-relaxed">
        <div>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor start &quot;todo app with auth&quot;</span>
        </div>
        <div className="space-y-1 text-white/60">
          <p>
            <span className="text-blue-400">Creating project...</span>
          </p>
          <p className="text-white/80">
            Project <span className="text-green-400">&quot;Todo App with Authentication&quot;</span>{' '}
            created
          </p>
          <p className="text-white/50">4 tasks generated based on your skill level</p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor hint</span>
        </div>
        <div className="space-y-1.5 rounded border border-yellow-500/10 bg-yellow-500/5 px-3 py-2 text-white/70">
          <p className="text-yellow-400/90">Hint (Level 1/4):</p>
          <p>Think about where user data needs to persist between page loads.</p>
          <p className="text-white/40">What browser API could help here?</p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor submit</span>
        </div>
        <div className="space-y-1.5 text-white/70">
          <p>
            <span className="text-blue-400">Reviewing your code...</span>
          </p>
          <p className="text-green-400">Task 1 passed!</p>
          <p>
            Concepts mastered: <span className="text-green-400">DOM manipulation</span>,{' '}
            <span className="text-green-400">event handling</span>
          </p>
          <p className="text-white/40">
            Question: Why did you choose addEventListener over onclick?
          </p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <span className="terminal-cursor text-green-400">$</span>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: MessageSquare,
    title: 'Socratic Code Review',
    description:
      'Your AI mentor asks "why" — not "what." Every code review probes your understanding, not just correctness.',
    href: '/features',
  },
  {
    icon: Repeat,
    title: 'Spaced Repetition',
    description:
      'Concepts resurface at optimal intervals. What you struggle with appears more often. What you master fades back.',
    href: '/features',
  },
  {
    icon: Brain,
    title: 'Learning Graph',
    description:
      'Visualize your knowledge as an interconnected map. See prerequisites, mastery levels, and what to learn next.',
    href: '/features',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="dot-pattern absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fade-in-up max-w-xl">
              <Badge variant="secondary" className="mb-6 font-mono text-xs">
                <Terminal className="mr-1.5 h-3 w-3" />
                CLI-first learning platform
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
                An AI mentor that teaches you to{' '}
                <span className="underline decoration-green-500/40 decoration-2 underline-offset-4">
                  think
                </span>{' '}
                like a developer
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                CodeMentor refuses to hand you code. Instead, it guides you through real projects
                with Socratic questions, progressive hints, and AI code reviews that build genuine
                understanding.
              </p>
              <div id="waitlist" className="mt-8 max-w-md">
                <WaitlistForm source="homepage" />
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Join the waitlist for early access. Free tier available.
                </p>
              </div>
            </div>
            <div className="animate-fade-in-up [animation-delay:200ms]">
              <TerminalMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-sm text-muted-foreground">The problem</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              AI makes you faster. It doesn&apos;t make you better.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Research shows junior developers using AI score{' '}
              <span className="font-semibold text-foreground">40% worse</span> on assessments. They
              produce working code without understanding why it works. CodeMentor fixes that.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                label: 'No code handouts',
                detail: 'The mentor guides, never gives answers directly',
              },
              {
                icon: GitBranch,
                label: 'Real projects',
                detail: 'AI-generated projects matched to your skill level',
              },
              {
                icon: Brain,
                label: 'Lasting knowledge',
                detail: 'Spaced repetition ensures concepts stick long-term',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-card p-5">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <p className="mt-3 font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-sm text-muted-foreground">Features</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Everything you need to go from stuck to skilled
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/5">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Learn more <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-sm text-muted-foreground">Pricing</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Start learning for free
            </h2>
            <p className="mt-3 text-muted-foreground">
              No credit card required. Upgrade when you&apos;re ready.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: ['1 project', 'AI code review', 'Progressive hints', 'Concept tracking'],
              },
              {
                name: 'Pro',
                price: '$15',
                period: '/month',
                features: [
                  'Unlimited projects',
                  'Learning graph',
                  'Spaced repetition',
                  'Priority reviews',
                ],
                highlighted: true,
              },
              {
                name: 'Teams',
                price: '$50',
                period: '/user/month',
                features: [
                  'Everything in Pro',
                  'Team dashboards',
                  'Custom curricula',
                  'Progress reports',
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border p-6 ${
                  plan.highlighted
                    ? 'border-primary/20 bg-card shadow-md ring-1 ring-primary/10'
                    : 'bg-card'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold">{plan.name}</p>
                  {plan.highlighted && (
                    <Badge variant="secondary" className="text-xs">
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-green-500">&#10003;</span>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to learn the right way?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join developers who are building real understanding — not just working code.
          </p>
          <div className="mt-8">
            <WaitlistForm source="homepage" className="justify-center" />
          </div>
        </div>
      </section>
    </>
  );
}
