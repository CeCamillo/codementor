import { anthropic, MODELS } from '../client';
import { getPlaybook } from '../playbooks';
import { getConceptById } from '../concepts';

export interface ReviewRequest {
  task: {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    conceptIds: string[];
  };
  files: Array<{ path: string; content: string }>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedReview {
  overallFeedback: string;
  passed: boolean;
  conceptsFeedback: Array<{
    conceptId: string;
    conceptName: string;
    demonstrated: boolean;
    feedback: string;
  }>;
  codeComments: Array<{
    filePath: string;
    lineStart: number;
    lineEnd: number;
    severity: 'praise' | 'suggestion' | 'issue' | 'critical';
    message: string;
  }>;
  suggestedResources: string[];
  reflectionQuestions: string[];
}

const codeReviewTool = {
  name: 'generate_code_review',
  description: 'Generate a structured code review with Socratic feedback',
  input_schema: {
    type: 'object' as const,
    properties: {
      overallFeedback: {
        type: 'string',
        description:
          'A 2-3 sentence overall assessment. Start with what works, then mention the main area for improvement.',
      },
      passed: {
        type: 'boolean',
        description:
          'True if core requirements are met and no critical issues. False if requirements unmet or critical issues exist.',
      },
      conceptsFeedback: {
        type: 'array',
        description: 'Feedback for each concept the task is meant to teach',
        items: {
          type: 'object',
          properties: {
            conceptId: {
              type: 'string',
              description: 'The ID of the concept being assessed',
            },
            conceptName: {
              type: 'string',
              description: 'Human-readable name of the concept',
            },
            demonstrated: {
              type: 'boolean',
              description: 'Whether the concept was successfully demonstrated in the code',
            },
            feedback: {
              type: 'string',
              description:
                'Socratic feedback - ask questions that lead to understanding, never give direct answers',
            },
          },
          required: ['conceptId', 'conceptName', 'demonstrated', 'feedback'],
        },
      },
      codeComments: {
        type: 'array',
        description: 'Specific comments on code sections',
        items: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file being commented on',
            },
            lineStart: {
              type: 'number',
              description: 'Starting line number (1-indexed)',
            },
            lineEnd: {
              type: 'number',
              description: 'Ending line number (1-indexed)',
            },
            severity: {
              type: 'string',
              enum: ['praise', 'suggestion', 'issue', 'critical'],
              description:
                'praise=good practice, suggestion=could improve, issue=should fix, critical=must fix',
            },
            message: {
              type: 'string',
              description:
                'The feedback message. For issues, use Socratic questions instead of direct answers.',
            },
          },
          required: ['filePath', 'lineStart', 'lineEnd', 'severity', 'message'],
        },
      },
      suggestedResources: {
        type: 'array',
        description: 'URLs or resource names for further learning (optional, only if relevant)',
        items: { type: 'string' },
      },
      reflectionQuestions: {
        type: 'array',
        description:
          '1-3 Socratic questions to help the learner think deeper about their code or the concepts',
        items: { type: 'string' },
      },
    },
    required: [
      'overallFeedback',
      'passed',
      'conceptsFeedback',
      'codeComments',
      'reflectionQuestions',
    ],
  },
};

function buildConceptContext(conceptIds: string[]): string {
  const concepts = conceptIds
    .map((id) => {
      const concept = getConceptById(id);
      return concept ? `- ${concept.id}: ${concept.name} - ${concept.description}` : null;
    })
    .filter(Boolean);

  if (concepts.length === 0) {
    return 'No specific concepts defined for this task.';
  }

  return `## Concepts to Assess\n\n${concepts.join('\n')}`;
}

function buildFilesContext(files: Array<{ path: string; content: string }>): string {
  return files
    .map((file) => {
      const lines = file.content.split('\n');
      const numberedLines = lines.map((line, i) => `${i + 1}| ${line}`).join('\n');
      return `### ${file.path}\n\`\`\`\n${numberedLines}\n\`\`\``;
    })
    .join('\n\n');
}

export async function generateReview(request: ReviewRequest): Promise<GeneratedReview> {
  const codeReviewPlaybook = getPlaybook('code-review');
  const socraticPlaybook = getPlaybook('socratic-questioning');
  const conceptContext = buildConceptContext(request.task.conceptIds);
  const filesContext = buildFilesContext(request.files);

  const systemPrompt = `${codeReviewPlaybook}

---

${socraticPlaybook}

---

${conceptContext}

---

You are reviewing code from a ${request.difficulty} developer learning web development.

CRITICAL INSTRUCTIONS:
1. Use Socratic questioning - ask questions that lead to discovery, NEVER give direct answers
2. For issues, phrase as questions: "What happens if X?" not "You need to do X"
3. Recognize effort and what's working before discussing improvements
4. Be encouraging but honest - pass only if core requirements are met
5. Include 1-3 reflection questions to deepen understanding
6. Keep feedback focused on the task's learning objectives

PASS CRITERIA:
- All core objectives are met
- No critical issues (code works for basic cases)
- Demonstrates understanding of the task's concepts

NEEDS WORK CRITERIA:
- Core objectives not met
- Critical issues that prevent functionality
- Clear misunderstanding of fundamental concepts`;

  const userMessage = `Review this code submission for the following task:

## Task: ${request.task.title}

${request.task.description}

### Objectives to Complete:
${request.task.objectives.map((obj) => `- ${obj}`).join('\n')}

## Submitted Code:

${filesContext}

Provide a thorough review using the generate_code_review tool.`;

  const response = await anthropic.messages.create({
    model: MODELS.SONNET,
    max_tokens: 4096,
    system: systemPrompt,
    tools: [codeReviewTool],
    tool_choice: { type: 'tool', name: 'generate_code_review' },
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return a valid code review');
  }

  const generated = toolUse.input as GeneratedReview;

  // Validate concept IDs - filter out any invalid ones
  const validatedConceptsFeedback = generated.conceptsFeedback.filter((cf) => {
    const concept = getConceptById(cf.conceptId);
    if (!concept) {
      console.warn(`Invalid concept ID from AI review: ${cf.conceptId}`);
      return false;
    }
    return true;
  });

  return {
    ...generated,
    conceptsFeedback: validatedConceptsFeedback,
    suggestedResources: generated.suggestedResources ?? [],
  };
}
