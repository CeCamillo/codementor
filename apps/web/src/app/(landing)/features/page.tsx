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
  title: 'Funcionalidades — CodeMentor',
  description:
    'Revisões de código por IA, repetição espaçada, rastreamento de conceitos, grafo de aprendizado interativo e uma experiência CLI-first.',
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
    badge: 'Principal',
    title: 'Code Review Socrático com IA',
    description:
      'Cada submissão passa por uma revisão em múltiplas etapas. A IA não apenas verifica se seu código funciona — ela pergunta por que você fez escolhas específicas e detecta mais de 14 anti-patterns.',
    details: [
      'Faz perguntas de raciocínio para verificar seu entendimento',
      'Detecta anti-patterns com explicações claras',
      'Executa seu código contra casos de teste gerados',
      'Dá feedback como um desenvolvedor sênior, não como um animador de torcida',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">codementor submit</span>
          </p>
          <p className="text-blue-400">Executando testes... 4/4 aprovados</p>
          <p className="text-blue-400">Revisando qualidade do código...</p>
          <div className="mt-2 space-y-1.5 rounded border border-white/5 bg-white/[0.02] px-3 py-2">
            <p className="text-yellow-400/90">Code Review:</p>
            <p>
              Seu <span className="text-blue-300">handleSubmit</span> funciona, mas você está
              misturando manipulação do DOM com lógica de negócios.
            </p>
            <p className="mt-1 text-white/40">
              Pergunta: Como você separaria a validação do formulário da chamada à API? Pense no
              princípio da responsabilidade única.
            </p>
          </div>
          <div className="mt-2">
            <p>
              <span className="text-white/40">Anti-pattern detectado:</span>{' '}
              <span className="text-orange-400">nested-callbacks</span>
            </p>
            <p className="text-white/40">Considere usar async/await para melhor legibilidade.</p>
          </div>
        </div>
      </CodeBlock>
    ),
  },
  {
    id: 'spaced-repetition',
    icon: Repeat,
    badge: 'Ciência do Aprendizado',
    title: 'Motor de Repetição Espaçada',
    description:
      'Baseado no algoritmo SM-2, os conceitos que você aprende são agendados para revisão em intervalos ideais. Tem dificuldade com algo? Volta mais cedo. Dominou? Vai para intervalos mais longos.',
    details: [
      'Algoritmo inspirado no SM-2 que se adapta ao seu desempenho',
      '4 níveis de domínio: Novato → Familiar → Proficiente → Dominado',
      'Detecção de dificuldade após 3+ falhas consecutivas',
      'Conceitos pendentes são integrados automaticamente em novos projetos',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">codementor concepts --due</span>
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-white/40">Conceitos para revisão:</p>
            <p>
              <span className="text-orange-400">&#9679;</span>{' '}
              <span className="text-white/80">CSS Flexbox</span>{' '}
              <span className="text-white/30">— praticado há 3 dias</span>
            </p>
            <p>
              <span className="text-orange-400">&#9679;</span>{' '}
              <span className="text-white/80">Métodos de Array</span>{' '}
              <span className="text-white/30">— praticado há 5 dias</span>
            </p>
            <p>
              <span className="text-yellow-400">&#9679;</span>{' '}
              <span className="text-white/80">Closures</span>{' '}
              <span className="text-white/30">— com dificuldade (4 tentativas)</span>
            </p>
          </div>
          <p className="mt-2 text-white/40">3 conceitos serão incluídos no seu próximo projeto.</p>
        </div>
      </CodeBlock>
    ),
  },
  {
    id: 'graph',
    icon: Brain,
    badge: 'Visualização',
    title: 'Grafo de Conceitos Interativo',
    description:
      'Seu aprendizado não é uma lista plana — é um grafo. Conceitos têm pré-requisitos, dependências e relações. O grafo de aprendizado interativo mostra exatamente onde você está e o que atacar a seguir.',
    details: [
      '50+ conceitos de desenvolvimento web mapeados com pré-requisitos',
      'Visualização interativa baseada em nós, com arrastar e soltar',
      'Níveis de domínio codificados por cores, visíveis de relance',
      'Visualização em lista para dispositivos móveis',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">codementor concepts --all</span>
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-white/40">Fundamentos Web:</p>
            <p>
              <span className="text-green-400">&#9632;</span>{' '}
              <span className="text-white/80">HTML Semântico</span>{' '}
              <span className="text-green-400/60">Dominado (92)</span>
            </p>
            <p>
              <span className="text-green-400">&#9632;</span>{' '}
              <span className="text-white/80">CSS Box Model</span>{' '}
              <span className="text-green-400/60">Dominado (85)</span>
            </p>
            <p>
              <span className="text-blue-400">&#9632;</span>{' '}
              <span className="text-white/80">CSS Flexbox</span>{' '}
              <span className="text-blue-400/60">Proficiente (68)</span>
            </p>
            <p>
              <span className="text-yellow-400">&#9632;</span>{' '}
              <span className="text-white/80">Manipulação do DOM</span>{' '}
              <span className="text-yellow-400/60">Familiar (41)</span>
            </p>
            <p>
              <span className="text-white/30">&#9632;</span>{' '}
              <span className="text-white/80">Event Delegation</span>{' '}
              <span className="text-white/30">Novato (12)</span>
            </p>
          </div>
          <p className="mt-2 text-white/40">18 conceitos rastreados em 4 categorias</p>
        </div>
      </CodeBlock>
    ),
  },
  {
    id: 'projects',
    icon: GitBranch,
    badge: 'Principal',
    title: 'Projetos Gerados por IA',
    description:
      'Diga ao mentor o que você quer construir. Ele gera um projeto estruturado com tarefas, objetivos e metas de aprendizado adaptados ao seu nível atual.',
    details: [
      'Descreva um projeto em linguagem natural',
      'Tarefas geradas automaticamente com objetivos claros',
      'Dificuldade se adapta aos seus níveis de domínio',
      'Conceitos pendentes de revisão são integrados naturalmente',
    ],
    terminal: (
      <CodeBlock>
        <div className="space-y-2 text-white/70">
          <p>
            <span className="text-green-400">$</span>{' '}
            <span className="text-white">
              codementor start &quot;app de clima com chamadas de API&quot;
            </span>
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-blue-400">Analisando seu nível...</p>
            <p>
              Projeto: <span className="text-white">Painel do Clima</span>
            </p>
            <p>
              Dificuldade: <span className="text-yellow-400">Intermediário</span>
            </p>
            <p className="text-white/40 mt-1">Tarefas:</p>
            <p>
              <span className="text-green-400">1.</span> Construir o layout da UI com CSS responsivo
            </p>
            <p>
              <span className="text-white/30">2.</span> Buscar dados de uma API de clima
            </p>
            <p>
              <span className="text-white/30">3.</span> Tratar estados de carregamento e erro
            </p>
            <p>
              <span className="text-white/30">4.</span> Adicionar busca de localização com
              debouncing
            </p>
          </div>
          <p className="mt-2 text-white/40">
            Inclui revisão de: fetch API, async/await, tratamento de erros
          </p>
        </div>
      </CodeBlock>
    ),
  },
  {
    id: 'cli',
    icon: Terminal,
    badge: 'Experiência do Desenvolvedor',
    title: 'Experiência CLI-First',
    description:
      'O aprendizado acontece onde você programa. Sem abas de navegador, sem troca de contexto. O CLI do CodeMentor vive no seu terminal junto com seu editor, seu git e suas ferramentas de build.',
    details: [
      'CLI leve — sem IDE pesada necessária',
      'Funciona junto com qualquer editor ou ambiente',
      'Dicas progressivas com 4 níveis de escalonamento',
      'Login via OAuth com GitHub ou Google',
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
              Projetos concluídos: <span className="text-white">3</span>
            </p>
            <p>
              Sequência atual: <span className="text-orange-400">7 dias</span>
            </p>
            <p>
              Conceitos dominados: <span className="text-green-400">12/50</span>
            </p>
            <p>
              Conceitos em progresso: <span className="text-blue-400">8</span>
            </p>
          </div>
          <div className="mt-3 border-t border-white/5 pt-3">
            <p className="text-white/40">Atividade recente:</p>
            <p>
              <span className="text-white/30">Hoje</span> — Submeteu Tarefa 2 de &quot;Painel do
              Clima&quot;
            </p>
            <p>
              <span className="text-white/30">Ontem</span> — Concluiu &quot;App de Tarefas com
              Autenticação&quot;
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
            Funcionalidades da plataforma
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.2]">
            Tudo que você precisa para dominar desenvolvimento web
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Uma plataforma de aprendizado CLI-first alimentada por IA que se recusa a te dar
            respostas — e é exatamente por isso que funciona.
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
            <p className="font-mono text-sm text-muted-foreground">Comandos</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Comandos simples, aprendizado poderoso
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tudo que você precisa está a poucas teclas de distância.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                cmd: 'codementor start',
                desc: 'Crie um projeto gerado por IA adaptado ao seu nível',
                icon: Lightbulb,
              },
              {
                cmd: 'codementor hint',
                desc: 'Receba dicas progressivas que vão do vago ao específico',
                icon: MessageSquare,
              },
              {
                cmd: 'codementor submit',
                desc: 'Submeta seu código para uma revisão completa por IA',
                icon: Code2,
              },
              {
                cmd: 'codementor progress',
                desc: 'Veja suas estatísticas de aprendizado, sequência e conquistas',
                icon: Trophy,
              },
              {
                cmd: 'codementor concepts',
                desc: 'Acompanhe seus níveis de domínio em 50+ conceitos',
                icon: Brain,
              },
              {
                cmd: 'codementor projects',
                desc: 'Liste e alterne entre seus projetos',
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
            Comece a construir entendimento real
          </h2>
          <p className="mt-3 text-muted-foreground">
            Entre na lista de espera e seja um dos primeiros a aprender com o CodeMentor.
          </p>
          <div className="mt-8">
            <WaitlistForm source="features" className="justify-center" />
          </div>
        </div>
      </section>
    </>
  );
}
