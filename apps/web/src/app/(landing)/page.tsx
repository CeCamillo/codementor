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
  title: 'CodeMentor — Um Mentor de IA Que Ensina Você a Pensar Como Desenvolvedor',
  description:
    'Aprenda desenvolvimento web com projetos práticos e um mentor de IA que usa perguntas socráticas. Sem respostas prontas, sem copiar e colar — entendimento real.',
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
        <span className="ml-2 font-mono text-xs text-white/30">~/projetos</span>
      </div>
      {/* Terminal content */}
      <div className="space-y-3 p-4 font-mono text-[13px] leading-relaxed">
        <div>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">
            codementor start &quot;app de tarefas com autenticação&quot;
          </span>
        </div>
        <div className="space-y-1 text-white/60">
          <p>
            <span className="text-blue-400">Criando projeto...</span>
          </p>
          <p className="text-white/80">
            Projeto{' '}
            <span className="text-green-400">&quot;App de Tarefas com Autenticação&quot;</span>{' '}
            criado
          </p>
          <p className="text-white/50">4 tarefas geradas com base no seu nível</p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor hint</span>
        </div>
        <div className="space-y-1.5 rounded border border-yellow-500/10 bg-yellow-500/5 px-3 py-2 text-white/70">
          <p className="text-yellow-400/90">Dica (Nível 1/4):</p>
          <p>Pense em onde os dados do usuário precisam persistir entre carregamentos de página.</p>
          <p className="text-white/40">Qual API do navegador poderia ajudar aqui?</p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor submit</span>
        </div>
        <div className="space-y-1.5 text-white/70">
          <p>
            <span className="text-blue-400">Revisando seu código...</span>
          </p>
          <p className="text-green-400">Tarefa 1 aprovada!</p>
          <p>
            Conceitos dominados: <span className="text-green-400">manipulação do DOM</span>,{' '}
            <span className="text-green-400">tratamento de eventos</span>
          </p>
          <p className="text-white/40">
            Pergunta: Por que você escolheu addEventListener ao invés de onclick?
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
    title: 'Code Review Socrático',
    description:
      'Seu mentor de IA pergunta "por quê" — não "o quê." Cada revisão de código investiga seu entendimento, não apenas se está correto.',
    href: '/features',
  },
  {
    icon: Repeat,
    title: 'Repetição Espaçada',
    description:
      'Conceitos reaparecem em intervalos ideais. O que você tem dificuldade aparece mais. O que você domina recua gradualmente.',
    href: '/features',
  },
  {
    icon: Brain,
    title: 'Grafo de Aprendizado',
    description:
      'Visualize seu conhecimento como um mapa interconectado. Veja pré-requisitos, níveis de domínio e o que aprender a seguir.',
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
                Plataforma de aprendizado CLI-first
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
                Um mentor de IA que ensina você a{' '}
                <span className="underline decoration-green-500/40 decoration-2 underline-offset-4">
                  pensar
                </span>{' '}
                como um desenvolvedor
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                O CodeMentor se recusa a te entregar código pronto. Em vez disso, ele te guia por
                projetos reais com perguntas socráticas, dicas progressivas e revisões de código por
                IA que constroem entendimento genuíno.
              </p>
              <div id="waitlist" className="mt-8 max-w-md">
                <WaitlistForm source="homepage" />
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Entre na lista de espera para acesso antecipado. Plano gratuito disponível.
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
            <p className="font-mono text-sm text-muted-foreground">O problema</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              IA te faz mais rápido. Não te faz melhor.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Pesquisas mostram que desenvolvedores juniores usando IA têm{' '}
              <span className="font-semibold text-foreground">40% menos</span> desempenho em
              avaliações. Eles produzem código que funciona sem entender por quê. O CodeMentor
              resolve isso.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                label: 'Sem código de bandeja',
                detail: 'O mentor guia, nunca entrega respostas diretamente',
              },
              {
                icon: GitBranch,
                label: 'Projetos reais',
                detail: 'Projetos gerados por IA adaptados ao seu nível',
              },
              {
                icon: Brain,
                label: 'Conhecimento duradouro',
                detail: 'Repetição espaçada garante que os conceitos fiquem a longo prazo',
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
          <p className="font-mono text-sm text-muted-foreground">Funcionalidades</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Tudo que você precisa para sair do zero e se tornar habilidoso
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
                Saiba mais <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-sm text-muted-foreground">Preços</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Comece a aprender de graça
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sem cartão de crédito. Faça upgrade quando estiver pronto.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Gratuito',
                price: 'R$0',
                period: 'para sempre',
                features: [
                  '1 projeto',
                  'Revisão de código por IA',
                  'Dicas progressivas',
                  'Rastreamento de conceitos',
                ],
              },
              {
                name: 'Pro',
                price: 'R$49',
                period: '/mês',
                features: [
                  'Projetos ilimitados',
                  'Grafo de aprendizado',
                  'Repetição espaçada',
                  'Revisões prioritárias',
                ],
                highlighted: true,
              },
              {
                name: 'Equipes',
                price: 'R$149',
                period: '/usuário/mês',
                features: [
                  'Tudo do Pro',
                  'Painéis de equipe',
                  'Currículos personalizados',
                  'Relatórios de progresso',
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
            Pronto para aprender do jeito certo?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Junte-se a desenvolvedores que estão construindo entendimento real — não apenas código
            que funciona.
          </p>
          <div className="mt-8">
            <WaitlistForm source="homepage" className="justify-center" />
          </div>
        </div>
      </section>
    </>
  );
}
