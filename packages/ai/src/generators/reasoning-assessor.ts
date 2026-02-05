import { anthropic, MODELS } from '../client';

export interface ReasoningAssessmentRequest {
  task: {
    title: string;
    description: string;
    objectives: string[];
  };
  files: Array<{ path: string; content: string }>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ReasoningQuestion {
  question: string;
  context: string;
  category: 'design_choice' | 'trade_off' | 'alternative' | 'understanding';
  relatedCode?:
    | {
        file: string;
        lineStart: number;
        lineEnd: number;
        snippet: string;
      }
    | undefined;
}

export interface ReasoningAssessmentResult {
  questions: ReasoningQuestion[];
  interestingPatterns: string[];
}

const reasoningAssessmentTool = {
  name: 'assess_reasoning',
  description: 'Generate questions to understand student reasoning and detect cargo-culted code',
  input_schema: {
    type: 'object' as const,
    properties: {
      questions: {
        type: 'array',
        description: 'Questions to ask the student about their implementation choices',
        items: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description:
                'The question to ask. Should be curious and non-judgmental, inviting explanation.',
            },
            context: {
              type: 'string',
              description: 'Brief context about what prompted this question',
            },
            category: {
              type: 'string',
              enum: ['design_choice', 'trade_off', 'alternative', 'understanding'],
              description:
                'design_choice: why this approach; trade_off: what was considered; alternative: awareness of other options; understanding: conceptual grasp',
            },
            file: {
              type: 'string',
              description: 'File path if referencing specific code',
            },
            lineStart: {
              type: 'number',
              description: 'Starting line of relevant code',
            },
            lineEnd: {
              type: 'number',
              description: 'Ending line of relevant code',
            },
            snippet: {
              type: 'string',
              description: 'The code snippet being referenced',
            },
          },
          required: ['question', 'context', 'category'],
        },
      },
      interestingPatterns: {
        type: 'array',
        description:
          'Notable patterns in the code that might indicate intentional or cargo-culted choices',
        items: { type: 'string' },
      },
    },
    required: ['questions', 'interestingPatterns'],
  },
};

function getQuestionCountByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): number {
  switch (difficulty) {
    case 'beginner':
      return 1;
    case 'intermediate':
      return 2;
    case 'advanced':
      return 3;
  }
}

export async function assessReasoning(
  request: ReasoningAssessmentRequest
): Promise<ReasoningAssessmentResult> {
  const questionCount = getQuestionCountByDifficulty(request.difficulty);

  const filesContext = request.files
    .map((f) => {
      const lines = f.content.split('\n');
      const numbered = lines.map((line, i) => `${i + 1}| ${line}`).join('\n');
      return `### ${f.path}\n\`\`\`\n${numbered}\n\`\`\``;
    })
    .join('\n\n');

  const systemPrompt = `You are a thoughtful code mentor assessing a student's understanding.

Your goal is to generate questions that:
1. Reveal whether the student understands their code or just copied it
2. Are curious and encouraging, never accusatory
3. Focus on interesting implementation choices
4. Help students think deeper about their decisions

For ${request.difficulty} level:
${request.difficulty === 'beginner' ? '- Ask simple "why did you choose this?" questions\n- Focus on basic understanding\n- Be very encouraging' : ''}
${request.difficulty === 'intermediate' ? '- Ask about trade-offs and alternatives\n- Probe understanding of patterns used\n- Balance curiosity with encouragement' : ''}
${request.difficulty === 'advanced' ? '- Ask about architectural decisions\n- Probe deep understanding of trade-offs\n- Challenge assumptions constructively' : ''}

Question categories:
- design_choice: "I noticed you used X. What led you to this approach?"
- trade_off: "What trade-offs did you consider when choosing X?"
- alternative: "Did you consider using Y instead? What made you choose X?"
- understanding: "Can you explain how X works in your solution?"

Generate exactly ${questionCount} question(s).

IMPORTANT: Questions should feel like genuine curiosity from a mentor, not interrogation. The goal is learning, not catching mistakes.`;

  const userMessage = `Analyze this submission and generate reasoning questions:

## Task: ${request.task.title}

${request.task.description}

### Objectives:
${request.task.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

## Submitted Code:

${filesContext}

Generate ${questionCount} thoughtful question(s) about the student's implementation choices.`;

  const response = await anthropic.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 2048,
    system: systemPrompt,
    tools: [reasoningAssessmentTool],
    tool_choice: { type: 'tool', name: 'assess_reasoning' },
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    // Return empty result if AI doesn't generate questions
    return {
      questions: [],
      interestingPatterns: [],
    };
  }

  const result = toolUse.input as {
    questions: Array<{
      question: string;
      context: string;
      category: 'design_choice' | 'trade_off' | 'alternative' | 'understanding';
      file?: string;
      lineStart?: number;
      lineEnd?: number;
      snippet?: string;
    }>;
    interestingPatterns: string[];
  };

  const questions: ReasoningQuestion[] = result.questions.map((q) => ({
    question: q.question,
    context: q.context,
    category: q.category,
    relatedCode:
      q.file && q.lineStart
        ? {
            file: q.file,
            lineStart: q.lineStart,
            lineEnd: q.lineEnd ?? q.lineStart,
            snippet: q.snippet ?? '',
          }
        : undefined,
  }));

  return {
    questions,
    interestingPatterns: result.interestingPatterns ?? [],
  };
}

// Utility function to format reasoning questions for display
export function formatReasoningQuestions(questions: ReasoningQuestion[]): string[] {
  return questions.map((q) => {
    if (q.relatedCode) {
      return `${q.question}\n  → Re: ${q.relatedCode.file}:${q.relatedCode.lineStart}`;
    }
    return q.question;
  });
}
