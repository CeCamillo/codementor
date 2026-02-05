import { anthropic, MODELS } from '../client';
import { getPlaybook } from '../playbooks';

export interface ReflectionFollowupRequest {
  task: {
    title: string;
    description: string;
    objectives: string[];
  };
  questions: string[];
  responses: Array<{ question: string; answer: string }>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ReflectionFollowupResponse {
  feedback: string;
  encouragement: string;
}

const reflectionFollowupTool = {
  name: 'generate_reflection_followup',
  description: 'Generate follow-up feedback based on user reflection answers',
  input_schema: {
    type: 'object' as const,
    properties: {
      feedback: {
        type: 'string',
        description:
          'Thoughtful feedback on their reflection answers. Acknowledge good insights, gently correct misconceptions using Socratic questions, and help deepen understanding. 2-4 sentences.',
      },
      encouragement: {
        type: 'string',
        description: 'A brief encouraging message about their learning progress. 1-2 sentences.',
      },
    },
    required: ['feedback', 'encouragement'],
  },
};

export async function generateReflectionFollowup(
  request: ReflectionFollowupRequest
): Promise<ReflectionFollowupResponse> {
  const socraticPlaybook = getPlaybook('socratic-questioning');

  const responsesFormatted = request.responses
    .map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}`)
    .join('\n\n');

  const systemPrompt = `${socraticPlaybook}

---

You are providing follow-up feedback on a ${request.difficulty} developer's reflection answers.

CRITICAL INSTRUCTIONS:
1. Acknowledge thoughtful answers - recognize effort and insight
2. For shallow answers, use Socratic follow-up questions to encourage deeper thinking
3. Gently correct any misconceptions without being condescending
4. Connect their reflections to the broader learning objectives
5. Be encouraging and supportive while maintaining honesty
6. Keep feedback concise and actionable`;

  const userMessage = `The learner just completed a task and answered reflection questions.

## Task: ${request.task.title}

${request.task.description}

### Objectives:
${request.task.objectives.map((obj) => `- ${obj}`).join('\n')}

## Their Reflection Answers:

${responsesFormatted}

Provide thoughtful follow-up feedback using the generate_reflection_followup tool.`;

  const response = await anthropic.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [reflectionFollowupTool],
    tool_choice: { type: 'tool', name: 'generate_reflection_followup' },
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return valid reflection feedback');
  }

  return toolUse.input as ReflectionFollowupResponse;
}
