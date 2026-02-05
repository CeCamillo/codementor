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
  title: 'Como Funciona — CodeMentor',
  description:
    'Instale o CLI, comece um projeto, construa com dicas, submeta para revisão por IA e acompanhe seu domínio. Aprenda desenvolvimento web em 5 passos.',
};

const steps = [
  {
    number: '01',
    icon: Download,
    title: 'Instale o CLI',
    description:
      'Um comando para instalar. Faça login com GitHub ou Google via OAuth device flow — sem senhas para lembrar.',
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
        <p className="text-blue-400">Abrindo navegador para autenticação com GitHub...</p>
        <p className="text-green-400">Logado como sarah.dev</p>
      </div>
    ),
  },
  {
    number: '02',
    icon: Lightbulb,
    title: 'Comece um projeto',
    description:
      'Descreva o que você quer construir. A IA gera um projeto estruturado com tarefas adaptadas ao seu nível atual.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor start &quot;blog com markdown&quot;</span>
        </p>
        <p>
          Projeto: <span className="text-white">Motor de Blog Markdown</span>
        </p>
        <p>
          Dificuldade: <span className="text-yellow-400">Intermediário</span>
        </p>
        <p className="text-white/40">4 tarefas geradas. Começando pela Tarefa 1.</p>
        <p className="mt-1">
          <span className="text-green-400">Tarefa 1:</span> Converter arquivos markdown em HTML
        </p>
      </div>
    ),
  },
  {
    number: '03',
    icon: Code2,
    title: 'Construa com orientação',
    description:
      'Trabalhe nas tarefas no seu ritmo. Quando travar, peça dicas — elas começam vagas e vão ficando mais específicas.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor hint</span>
        </p>
        <div className="rounded border border-yellow-500/10 bg-yellow-500/5 px-3 py-2">
          <p className="text-yellow-400/90">Dica (Nível 2/4):</p>
          <p>
            Você vai precisar ler o sistema de arquivos. O Node.js tem um módulo nativo para isso.
          </p>
          <p className="text-white/40">
            Qual é a diferença entre leitura síncrona e assíncrona de arquivos?
          </p>
        </div>
      </div>
    ),
  },
  {
    number: '04',
    icon: Send,
    title: 'Submeta para revisão',
    description:
      'Submeta seu código e receba uma revisão completa por IA. Ela verifica corretude, executa testes, detecta anti-patterns e pede que você explique seu raciocínio.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor submit</span>
        </p>
        <p className="text-blue-400">Executando testes... 3/3 aprovados</p>
        <p className="text-green-400">Tarefa 1 concluída!</p>
        <p>
          <span className="text-white/40">Conceitos demonstrados:</span>{' '}
          <span className="text-green-400">I/O de arquivos</span>,{' '}
          <span className="text-green-400">parsing de strings</span>
        </p>
        <p className="text-white/40">
          Pergunta: Por que você escolheu readFileSync ao invés de readFile aqui?
        </p>
      </div>
    ),
  },
  {
    number: '05',
    icon: TrendingUp,
    title: 'Acompanhe seu domínio',
    description:
      'Veja seu mapa de conceitos crescer. O motor de repetição espaçada agenda revisões em intervalos ideais para que o conhecimento se fixe a longo prazo.',
    terminal: (
      <div className="space-y-2 font-mono text-[13px] text-white/70">
        <p>
          <span className="text-green-400">$</span>{' '}
          <span className="text-white">codementor progress</span>
        </p>
        <p>
          Projetos: <span className="text-white">3 concluídos</span>,{' '}
          <span className="text-blue-400">1 em progresso</span>
        </p>
        <p>
          Sequência: <span className="text-orange-400">12 dias</span>
        </p>
        <p>
          Conceitos: <span className="text-green-400">15 dominados</span>,{' '}
          <span className="text-blue-400">8 em progresso</span>,{' '}
          <span className="text-orange-400">3 para revisão</span>
        </p>
      </div>
    ),
  },
];

const personas = [
  {
    icon: Repeat,
    title: 'Transição de Carreira',
    description:
      'Você está mudando para tecnologia vindo de outra área. Precisa de um aprendizado estruturado que construa habilidades reais, não apenas familiaridade com sintaxe.',
    highlights: [
      'Progressão guiada de projetos',
      'Sem pré-requisitos necessários',
      'Construa um portfólio real',
    ],
  },
  {
    icon: BookOpen,
    title: 'Desenvolvedores Autodidatas',
    description:
      'Você consegue seguir tutoriais, mas trava quando as rodinhas saem. O CodeMentor preenche as lacunas no seu entendimento.',
    highlights: [
      'Identifique lacunas de conhecimento',
      'Questionamento socrático',
      'Saia do ciclo de tutoriais',
    ],
  },
  {
    icon: Users,
    title: 'Alunos de Bootcamp',
    description:
      'Seu bootcamp vai rápido e você precisa de prática extra. O CodeMentor reforça o que você está aprendendo com repetição espaçada.',
    highlights: [
      'Reforce conceitos do bootcamp',
      'Agendamento de repetição espaçada',
      'Acompanhe o domínio ao longo do tempo',
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
            Primeiros passos
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.2]">
            Do zero ao entendimento em cinco passos
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            O CodeMentor vive no seu terminal. Instale, descreva um projeto e comece a aprender — a
            IA cuida do resto.
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
            <p className="font-mono text-sm text-muted-foreground">Para quem é</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Feito para quem quer realmente aprender
            </h2>
            <p className="mt-3 text-muted-foreground">Não apenas escrever código — entendê-lo.</p>
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
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Perguntas frequentes
          </h2>
        </div>
        <div className="mt-12 space-y-6">
          {[
            {
              q: 'Preciso de experiência em programação?',
              a: 'Um pouco de base ajuda. Se você completou um curso introdutório ou uma série de tutoriais, está pronto. O CodeMentor começa do iniciante e se adapta ao seu nível.',
            },
            {
              q: 'Por que CLI e não um app web?',
              a: 'O aprendizado deve acontecer onde você programa. Alternar entre navegador e editor quebra o fluxo. O CLI te mantém no terminal junto com suas ferramentas reais.',
            },
            {
              q: 'Como isso é diferente do ChatGPT?',
              a: 'O ChatGPT te dá código. O CodeMentor se recusa a dar. Ele faz perguntas, dá dicas e revisa seu trabalho — mas você tem que pensar. É assim que o aprendizado real acontece.',
            },
            {
              q: 'Quais linguagens e tópicos são cobertos?',
              a: 'Atualmente focado em fundamentos de desenvolvimento web: HTML, CSS, JavaScript, TypeScript e frameworks populares. O grafo de conceitos cobre mais de 50 tópicos.',
            },
            {
              q: 'Meu código é armazenado ou compartilhado?',
              a: 'Seu código é enviado à IA para revisão mas nunca é armazenado permanentemente ou compartilhado. Retemos apenas dados de progresso de aprendizado para alimentar a repetição espaçada.',
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
              Pronto para começar a aprender?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Entre na lista de espera e avisaremos quando o CodeMentor estiver pronto.
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
