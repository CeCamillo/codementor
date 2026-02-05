import { anthropic, MODELS } from '../client';
import { getPlaybook } from '../playbooks';
import { getConceptById } from '../concepts';

export interface HintRequest {
  task: {
    title: string;
    description: string;
    objectives: string[];
    conceptIds: string[];
  };
  attemptNumber: number;
  previousHints: string[];
  userCode?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface HintResponse {
  hint: string;
  hintLevel: 1 | 2 | 3 | 4;
  conceptPointers: string[];
  isLastHint: boolean;
}

const hintGeneratorTool = {
  name: 'generate_hint',
  description: 'Generate a progressive hint for a struggling learner',
  input_schema: {
    type: 'object' as const,
    properties: {
      hint: {
        type: 'string',
        description:
          'The hint text appropriate to the current hint level. Never give actual code, only conceptual guidance.',
      },
      hintLevel: {
        type: 'number',
        enum: [1, 2, 3, 4],
        description:
          'The escalation level: 1=direction only, 2=concept pointer, 3=structural hint, 4=conceptual solution (pseudocode, not code)',
      },
      conceptPointers: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Concept IDs that the learner should review. These should match valid concept IDs from the system.',
      },
      isLastHint: {
        type: 'boolean',
        description:
          'True if this is hint level 4 (the most specific hint available without giving the answer)',
      },
    },
    required: ['hint', 'hintLevel', 'conceptPointers', 'isLastHint'],
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

  return `## Related Concepts\n\n${concepts.join('\n')}`;
}

function determineHintLevel(attemptNumber: number, previousHints: string[]): 1 | 2 | 3 | 4 {
  const hintCount = previousHints.length;

  if (hintCount === 0) return 1;
  if (hintCount === 1) return 2;
  if (hintCount === 2) return 3;
  return 4;
}

export async function generateHint(request: HintRequest): Promise<HintResponse> {
  const socraticPlaybook = getPlaybook('socratic-questioning');
  const conceptContext = buildConceptContext(request.task.conceptIds);
  const targetHintLevel = determineHintLevel(request.attemptNumber, request.previousHints);

  const previousHintsContext =
    request.previousHints.length > 0
      ? `## Previous Hints Given\n\n${request.previousHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
      : 'No previous hints have been given yet.';

  const userCodeContext = request.userCode
    ? `## User's Current Code Attempt\n\n\`\`\`\n${request.userCode}\n\`\`\``
    : 'The user has not submitted any code yet.';

  const systemPrompt = `${socraticPlaybook}

---

${conceptContext}

---

You are generating a hint for a ${request.difficulty} developer who is struggling with a task.

## Hint Escalation Ladder

### Level 1: Direction Only
Point toward the concept without specifics. Ask what they know about the relevant topic.
Example: "This relates to how JavaScript handles asynchronous operations. What do you know about Promises?"

### Level 2: Concept Pointer
Narrow down to the specific area. Reference line numbers if code is available.
Example: "The issue is in how you're waiting for the fetch to complete. Look at lines 15-20. What's different about how async functions work?"

### Level 3: Structural Hint
Provide a focused question with more context about the structure needed.
Example: "You're calling setState with the result of fetch(), but fetch returns a Promise, not the data. What method do you use to get the actual data from a Promise?"

### Level 4: Conceptual Solution (Last Resort)
Explain the concept and provide pseudocode, but let them write the actual code.
Example: "fetch() returns a Promise. You need to either await it or use .then() to access the response, and then call .json() on the response to get the data. Try restructuring your code with async/await."

CRITICAL INSTRUCTIONS:
1. Generate a Level ${targetHintLevel} hint based on the escalation ladder above
2. NEVER provide actual working code - only conceptual guidance
3. Reference the user's code specifically if available
4. Don't repeat information from previous hints - build on them
5. Point to relevant concepts they should review
6. Be encouraging but not patronizing
7. Assume intelligence, not knowledge`;

  const userMessage = `Generate a hint for this task:

## Task: ${request.task.title}

${request.task.description}

### Objectives:
${request.task.objectives.map((obj) => `- ${obj}`).join('\n')}

${previousHintsContext}

${userCodeContext}

Attempt number: ${request.attemptNumber}
Target hint level: ${targetHintLevel}

Generate an appropriate hint using the generate_hint tool.`;

  const response = await anthropic.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [hintGeneratorTool],
    tool_choice: { type: 'tool', name: 'generate_hint' },
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return a valid hint');
  }

  const generated = toolUse.input as HintResponse;

  // Validate concept pointers - filter to only valid concept IDs
  const validConceptPointers = generated.conceptPointers.filter((id) => {
    const concept = getConceptById(id);
    if (!concept) {
      console.warn(`Invalid concept ID from AI hint: ${id}`);
      return false;
    }
    return true;
  });

  return {
    ...generated,
    hintLevel: targetHintLevel,
    isLastHint: targetHintLevel === 4,
    conceptPointers: validConceptPointers,
  };
}
