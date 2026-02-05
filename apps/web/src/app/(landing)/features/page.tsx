import type { Metadata } from 'next';
import {
  Brain,
  Code2,
  GitBranch,
  Lightbulb,
  MessageSquare,
  Repeat,
  Terminal,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WaitlistForm } from '@/components/landing/waitlist-form';

export const metadata: Metadata = {
  title: 'Features — CodeMentor',
  description:
    'AI code reviews, spaced repetition, concept tracking, interactive learning graph, and a CLI-first learning experience.',
};

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-[#0a0a0f] text-[13px]">
      <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
      </div>
      <div className="p-4 font-mono leading-relaxed">{children}</div>
    </div>
  );
}

const features = [
  {
    id: 'review',
    icon: MessageSquare,
    badge: 'Core',
    title: 'Socratic AI Code Review',
    description:
      "Every submission goes through a multi-step review. The AI doesn't just check if your code works — it asks why you made specific choices and checks for 14+ anti-patterns.",
    details: [
      'Asks reasoning questions to verify understanding',
      'Detects anti-patterns with clear explanations',
      'Runs your code against generated test cases',
      'Provides feedback like a senior developer, not a cheerleader',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">codementor submit</span>
          </p>
          <p className="text-blue-400">Running tests... 4/4 passed</p>
          <p className="text-blue-400">Reviewing code quality...</p>
          <div className="mt-2 space-y-1.5 rounded border border-white/5 bg-white/[0.02] px-3 py-2">
            <p className="text-yellow-400/90">Code Review:</p>
            <p>
              Your <span className="text-blue-300">handleSubmit</span> works, but you&apos;re mixing
              DOM manipulation with business logic.
            </p>
            <p className="mt-1 text-white/40">
              Question: How would you separate the form validation from the API call? Think about
              the single responsibility principle.
            </p>
          </div>
          <div className="mt-2">
            <p>
              <span className="text-white/40">Anti-pattern detected:</span>{' '}
              <span className="text-orange-400">nested-callbacks</span>
            </p>
            <p className="text-white/40">Consider using async/await for readability.</p>
          </div>
        </div>
      </CodeBlock>
    ),
  },
  {
    id: 'spaced-repetition',
    icon: Repeat,
    badge: 'Learning Science',
    title: 'Spaced Repetition Engine',
    description:
      'Based on the SM-2 algorithm, concepts you learn are scheduled for review at optimal intervals. Struggle with something? It comes back sooner. Mastered it? It fades into longer intervals.',
    details: [
      'SM-2 inspired algorithm adapts to your performance',
      '4 mastery tiers: Novice → Familiar → Proficient → Mastered',
      'Struggling detection after 3+ consecutive failures',
      'Due concepts are woven into new projects automatically',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">codementor concepts --due</span>
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-white/40">Concepts due for review:</p>
            <p>
              <span className="text-orange-400">&#9679;</span>{' '}
              <span className="text-white/80">CSS Flexbox</span>{' '}
              <span className="text-white/30">— last practiced 3 days ago</span>
            </p>
            <p>
              <span className="text-orange-400">&#9679;</span>{' '}
              <span className="text-white/80">Array methods</span>{' '}
              <span className="text-white/30">— last practiced 5 days ago</span>
            </p>
            <p>
              <span className="text-yellow-400">&#9679;</span>{' '}
              <span className="text-white/80">Closures</span>{' '}
              <span className="text-white/30">— struggling (4 attempts)</span>
            </p>
          </div>
          <p className="mt-2 text-white/40">3 concepts will be included in your next project.</p>
        </div>
      </CodeBlock>
    ),
  },
  {
    id: 'graph',
    icon: Brain,
    badge: 'Visualization',
    title: 'Interactive Concept Graph',
    description:
      "Your learning isn't a flat list — it's a graph. Concepts have prerequisites, dependencies, and relationships. The interactive learning graph shows you exactly where you stand and what to tackle next.",
    details: [
      '50+ web development concepts mapped with prerequisites',
      'Draggable, interactive node-based visualization',
      'Color-coded mastery levels at a glance',
      'Mobile-friendly list view fallback',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">codementor concepts --all</span>
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-white/40">Web Fundamentals:</p>
            <p>
              <span className="text-green-400">&#9632;</span>{' '}
              <span className="text-white/80">HTML Semantics</span>{' '}
              <span className="text-green-400/60">Mastered (92)</span>
            </p>
            <p>
              <span className="text-green-400">&#9632;</span>{' '}
              <span className="text-white/80">CSS Box Model</span>{' '}
              <span className="text-green-400/60">Mastered (85)</span>
            </p>
            <p>
              <span className="text-blue-400">&#9632;</span>{' '}
              <span className="text-white/80">CSS Flexbox</span>{' '}
              <span className="text-blue-400/60">Proficient (68)</span>
            </p>
            <p>
              <span className="text-yellow-400">&#9632;</span>{' '}
              <span className="text-white/80">DOM Manipulation</span>{' '}
              <span className="text-yellow-400/60">Familiar (41)</span>
            </p>
            <p>
              <span className="text-white/30">&#9632;</span>{' '}
              <span className="text-white/80">Event Delegation</span>{' '}
              <span className="text-white/30">Novice (12)</span>
            </p>
          </div>
          <p className="mt-2 text-white/40">18 concepts tracked across 4 categories</p>
        </div>
      </CodeBlock>
    ),
  },
  {
    id: 'projects',
    icon: GitBranch,
    badge: 'Core',
    title: 'AI-Generated Projects',
    description:
      'Tell the mentor what you want to build. It generates a structured project with tasks, objectives, and learning goals tailored to your current skill level.',
    details: [
      'Describe a project in plain English',
      'Tasks auto-generated with clear objectives',
      'Difficulty adapts to your mastery levels',
      'Concepts due for review are woven in naturally',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">
              codementor start &quot;weather app with API calls&quot;
            </span>
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-blue-400">Analyzing your skill level...</p>
            <p>
              Project: <span className="text-white">Weather Dashboard</span>
            </p>
            <p>
              Difficulty: <span className="text-yellow-400">Intermediate</span>
            </p>
            <p className="text-white/40 mt-1">Tasks:</p>
            <p>
              <span className="text-green-400">1.</span> Build the UI layout with responsive CSS
            </p>
            <p>
              <span className="text-white/30">2.</span> Fetch data from a weather API
            </p>
            <p>
              <span className="text-white/30">3.</span> Handle loading and error states
            </p>
            <p>
              <span className="text-white/30">4.</span> Add location search with debouncing
            </p>
          </div>
          <p className="mt-2 text-white/40">
            Includes review of: fetch API, async/await, error handling
          </p>
        </div>
      </CodeBlock>
    ),
  },
  {
    id: 'cli',
    icon: Terminal,
    badge: 'Developer Experience',
    title: 'CLI-First Experience',
    description:
      'Learning happens where you code. No browser tabs, no context switching. The CodeMentor CLI lives in your terminal alongside your editor, your git, and your build tools.',
    details: [
      'Lightweight CLI — no heavy IDE required',
      'Works alongside any editor or environment',
      'Progressive hints with 4-level escalation',
      'OAuth login via GitHub or Google',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">codementor progress</span>
          </p>
          <div className="mt-1 space-y-1">
            <p>
              Projects completed: <span className="text-white">3</span>
            </p>
            <p>
              Current streak: <span className="text-orange-400">7 days</span>
            </p>
            <p>
              Concepts mastered: <span className="text-green-400">12/50</span>
            </p>
            <p>
              Concepts in progress: <span className="text-blue-400">8</span>
            </p>
          </div>
          <div className="mt-3 border-t border-white/5 pt-3">
            <p className="text-white/40">Recent activity:</p>
            <p>
              <span className="text-white/30">Today</span> — Submitted Task 2 of &quot;Weather
              Dashboard&quot;
            </p>
            <p>
              <span className="text-white/30">Yesterday</span> — Completed &quot;Todo App with
              Auth&quot;
            </p>
          </div>
        </div>
      </CodeBlock>
    ),
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-20 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-5 font-mono text-xs">
            <Code2 className="mr-1.5 h-3 w-3" />
            Platform features
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.2]">
            Everything you need to master web development
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            A CLI-first learning platform powered by AI that refuses to give you answers — and
            that&apos;s exactly why it works.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="space-y-24 sm:space-y-32">
          {features.map((feature, i) => (
            <div
              key={feature.id}
              className={`grid items-start gap-10 lg:grid-cols-2 lg:gap-16 ${
                i % 2 === 1 ? 'lg:[direction:rtl] lg:[&>*]:[direction:ltr]' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/5">
                    <feature.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight">{feature.title}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{feature.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 text-green-500">&#10003;</span>
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>{feature.terminal}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CLI commands overview */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-sm text-muted-foreground">Commands</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Simple commands, powerful learning
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need is a few keystrokes away.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                cmd: 'codementor start',
                desc: 'Create an AI-generated project tailored to your level',
                icon: Lightbulb,
              },
              {
                cmd: 'codementor hint',
                desc: 'Get progressive hints that escalate from vague to specific',
                icon: MessageSquare,
              },
              {
                cmd: 'codementor submit',
                desc: 'Submit your code for comprehensive AI review',
                icon: Code2,
              },
              {
                cmd: 'codementor progress',
                desc: 'View your learning stats, streak, and achievements',
                icon: Trophy,
              },
              {
                cmd: 'codementor concepts',
                desc: 'Track mastery levels across 50+ concepts',
                icon: Brain,
              },
              {
                cmd: 'codementor projects',
                desc: 'List and switch between your projects',
                icon: GitBranch,
              },
            ].map((item) => (
              <div key={item.cmd} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <code className="font-mono text-sm font-semibold">{item.cmd}</code>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div id="waitlist" className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Start building real understanding
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join the waitlist and be among the first to learn with CodeMentor.
          </p>
          <div className="mt-8">
            <WaitlistForm source="features" className="justify-center" />
          </div>
        </div>
      </section>
    </>
  );
}
