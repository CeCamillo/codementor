import type { Metadata } from 'next';
import {
  ArrowDown,
  BookOpen,
  Code2,
  Download,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Repeat,
  Send,
  Terminal,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WaitlistForm } from '@/components/landing/waitlist-form';

export const metadata: Metadata = {
  title: 'How It Works — CodeMentor',
  description:
    'Install the CLI, start a project, build with hints, submit for AI review, and track your mastery. Learn web development in 5 steps.',
};

const steps = [
  {
    number: '01',
    icon: Download,
    title: 'Install the CLI',
    description:
      'One command to install. Sign in with GitHub or Google via OAuth device flow — no passwords to remember.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">npm install -g codementor</span>
        </p>
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor login</span>
        </p>
        <p className="text-blue-400">Opening browser for GitHub authentication...</p>
        <p className="text-green-400">Logged in as sarah.dev</p>
      </div>
    ),
  },
  {
    number: '02',
    icon: Lightbulb,
    title: 'Start a project',
    description:
      'Describe what you want to build. The AI generates a structured project with tasks matched to your current skill level.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor start &quot;blog with markdown&quot;</span>
        </p>
        <p>
          Project: <span className="text-white">Markdown Blog Engine</span>
        </p>
        <p>
          Difficulty: <span className="text-yellow-400">Intermediate</span>
        </p>
        <p className="text-white/40">4 tasks generated. Starting with Task 1.</p>
        <p className="mt-1">
          <span className="text-green-400">Task 1:</span> Parse markdown files into HTML
        </p>
      </div>
    ),
  },
  {
    number: '03',
    icon: Code2,
    title: 'Build with guidance',
    description:
      'Work through tasks at your own pace. When you get stuck, ask for hints — they start vague and get more specific.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor hint</span>
        </p>
        <div className="rounded border border-yellow-500/10 bg-yellow-500/5 px-3 py-2">
          <p className="text-yellow-400/90">Hint (Level 2/4):</p>
          <p>You&apos;ll need to read the file system. Node.js has a built-in module for that.</p>
          <p className="text-white/40">
            What&apos;s the difference between sync and async file reading?
          </p>
        </div>
      </div>
    ),
  },
  {
    number: '04',
    icon: Send,
    title: 'Submit for review',
    description:
      'Submit your code and get a thorough AI review. It checks correctness, runs tests, detects anti-patterns, and asks you to explain your reasoning.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor submit</span>
        </p>
        <p className="text-blue-400">Running tests... 3/3 passed</p>
        <p className="text-green-400">Task 1 complete!</p>
        <p>
          <span className="text-white/40">Concepts demonstrated:</span>{' '}
          <span className="text-green-400">file I/O</span>,{' '}
          <span className="text-green-400">string parsing</span>
        </p>
        <p className="text-white/40">
          Question: Why did you choose readFileSync over readFile here?
        </p>
      </div>
    ),
  },
  {
    number: '05',
    icon: TrendingUp,
    title: 'Track your mastery',
    description:
      'Watch your concept map grow. The spaced repetition engine schedules reviews at optimal intervals so knowledge sticks long-term.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor progress</span>
        </p>
        <p>
          Projects: <span className="text-white">3 completed</span>,{' '}
          <span className="text-blue-400">1 in progress</span>
        </p>
        <p>
          Streak: <span className="text-orange-400">12 days</span>
        </p>
        <p>
          Concepts: <span className="text-green-400">15 mastered</span>,{' '}
          <span className="text-blue-400">8 in progress</span>,{' '}
          <span className="text-orange-400">3 due for review</span>
        </p>
      </div>
    ),
  },
];

const personas = [
  {
    icon: Repeat,
    title: 'Career Changers',
    description:
      "You're switching to tech from another field. You need structured learning that builds real skills, not just familiarity with syntax.",
    highlights: [
      'Guided project progression',
      'No prerequisites assumed',
      'Build a real portfolio',
    ],
  },
  {
    icon: BookOpen,
    title: 'Self-Taught Developers',
    description:
      'You can follow tutorials, but you struggle when the training wheels come off. CodeMentor fills the gaps in your understanding.',
    highlights: ['Identify knowledge gaps', 'Socratic questioning', 'Move beyond tutorial hell'],
  },
  {
    icon: Users,
    title: 'Bootcamp Students',
    description:
      "Your bootcamp moves fast and you need extra practice. CodeMentor reinforces what you're learning with spaced repetition.",
    highlights: [
      'Reinforce bootcamp concepts',
      'Spaced repetition scheduling',
      'Track mastery over time',
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-20 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-5 font-mono text-xs">
            <Terminal className="mr-1.5 h-3 w-3" />
            Getting started
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.2]">
            From zero to understanding in five steps
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            CodeMentor lives in your terminal. Install, describe a project, and start learning — the
            AI handles the rest.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={step.number}>
              <div className="rounded-lg border bg-card">
                <div className="grid gap-6 p-6 md:grid-cols-2 md:gap-8 md:p-8">
                  {/* Left: description */}
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 font-mono text-sm font-bold text-primary">
                        {step.number}
                      </span>
                      <step.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h2 className="mt-3 text-xl font-bold">{step.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Right: terminal */}
                  <div className="overflow-hidden rounded-lg border border-border/50 bg-[#0a0a0f]">
                    <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500/70" />
                      <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
                      <span className="h-2 w-2 rounded-full bg-green-500/70" />
                    </div>
                    <div className="p-4">{step.terminal}</div>
                  </div>
                </div>
              </div>

              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Who is this for */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-sm text-muted-foreground">Who it&apos;s for</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Built for people who want to actually learn
            </h2>
            <p className="mt-3 text-muted-foreground">Not just write code — understand it.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {personas.map((persona) => (
              <div key={persona.title} className="rounded-lg border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/5">
                  <persona.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{persona.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {persona.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {persona.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-green-500">&#10003;</span>
                      <span className="text-muted-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
        <div className="text-center">
          <p className="font-mono text-sm text-muted-foreground">FAQ</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Common questions</h2>
        </div>
        <div className="mt-12 space-y-6">
          {[
            {
              q: 'Do I need any programming experience?',
              a: "Some basics help. If you've completed an intro course or tutorial series, you're ready. CodeMentor starts from beginner and adapts to your level.",
            },
            {
              q: 'Why CLI and not a web app?',
              a: 'Learning should happen where you code. Switching between a browser and your editor breaks flow. The CLI keeps you in the terminal alongside your real tools.',
            },
            {
              q: 'How is this different from ChatGPT?',
              a: "ChatGPT gives you code. CodeMentor refuses to. It asks questions, gives hints, and reviews your work — but you have to do the thinking. That's how real learning happens.",
            },
            {
              q: 'What languages and topics does it cover?',
              a: 'Currently focused on web development fundamentals: HTML, CSS, JavaScript, TypeScript, and common frameworks. The concept graph covers 50+ topics.',
            },
            {
              q: 'Is my code stored or shared?',
              a: 'Your code is sent to the AI for review but never stored permanently or shared. We retain learning progress data to power spaced repetition.',
            },
          ].map((item) => (
            <details key={item.q} className="group rounded-lg border bg-card">
              <summary className="flex cursor-pointer items-center justify-between p-5 font-medium">
                <span>{item.q}</span>
                <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t px-5 pb-5 pt-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div id="waitlist" className="mx-auto max-w-lg text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to start learning?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Join the waitlist and we&apos;ll notify you when CodeMentor is ready.
            </p>
            <div className="mt-8">
              <WaitlistForm source="how_it_works" className="justify-center" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
