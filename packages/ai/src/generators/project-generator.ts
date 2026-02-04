import type { GeneratedProject, GenerateProjectRequest } from '@codementor/shared';
import { anthropic, MODELS } from '../client';
import { getPlaybook } from '../playbooks';
import { getWebFundamentalsConcepts, getConceptById } from '../concepts';

const projectBreakdownTool = {
  name: 'generate_project_breakdown',
  description: 'Generate a structured learning project breakdown with tasks',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: 'A concise, descriptive title for the project',
      },
      summary: {
        type: 'string',
        description: 'A brief summary of what the project will build and teach',
      },
      difficulty: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: 'The overall difficulty level of the project',
      },
      tasks: {
        type: 'array',
        description: 'The sequential tasks that make up the project',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Action-oriented task title',
            },
            description: {
              type: 'string',
              description: 'What the user will build in this task',
            },
            objectives: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific objectives to complete the task',
            },
            hints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Graduated hints from general to specific',
            },
            conceptIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of concepts this task teaches (from the provided concept tree)',
            },
            estimatedMinutes: {
              type: 'number',
              description: 'Estimated time to complete in minutes',
            },
            order: {
              type: 'number',
              description: 'The sequence order of this task (1-indexed)',
            },
          },
          required: [
            'title',
            'description',
            'objectives',
            'hints',
            'conceptIds',
            'estimatedMinutes',
            'order',
          ],
        },
      },
      totalEstimatedMinutes: {
        type: 'number',
        description: 'Total estimated time for the entire project in minutes',
      },
    },
    required: ['title', 'summary', 'difficulty', 'tasks', 'totalEstimatedMinutes'],
  },
};

function buildConceptReference(): string {
  const concepts = getWebFundamentalsConcepts();
  const byCategory = concepts.reduce(
    (acc, c) => {
      const category = acc[c.category] ?? [];
      category.push(c);
      acc[c.category] = category;
      return acc;
    },
    {} as Record<string, typeof concepts>
  );

  let reference = '## Available Concept IDs\n\n';
  reference += 'Use ONLY these concept IDs in your response:\n\n';

  for (const [category, categoryConepts] of Object.entries(byCategory)) {
    reference += `### ${category}\n`;
    for (const c of categoryConepts) {
      reference += `- \`${c.id}\`: ${c.name} (Tier ${c.tier})\n`;
    }
    reference += '\n';
  }

  return reference;
}

function validateAndFilterConceptIds(conceptIds: string[]): string[] {
  const validIds: string[] = [];
  for (const id of conceptIds) {
    if (getConceptById(id)) {
      validIds.push(id);
    } else {
      console.warn(`Invalid concept ID from AI: ${id}`);
    }
  }
  return validIds;
}

export async function generateProject(request: GenerateProjectRequest): Promise<GeneratedProject> {
  const playbook = getPlaybook('project-breakdown');
  const conceptReference = buildConceptReference();

  const difficulty = request.difficulty ?? 'beginner';

  const systemPrompt = `${playbook}

${conceptReference}

You are generating a learning project for a ${difficulty} developer.

IMPORTANT:
- Create 5-7 tasks that build on each other progressively
- Each task should produce visible, working functionality
- Use ONLY concept IDs from the list above
- Match task complexity to the ${difficulty} level
- Estimate realistic times (beginners need more time)`;

  const response = await anthropic.messages.create({
    model: MODELS.SONNET,
    max_tokens: 4096,
    system: systemPrompt,
    tools: [projectBreakdownTool],
    tool_choice: { type: 'tool', name: 'generate_project_breakdown' },
    messages: [
      {
        role: 'user',
        content: `Break down this project into learning tasks:\n\n${request.description}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return a valid project breakdown');
  }

  const generated = toolUse.input as GeneratedProject;

  // Validate and filter concept IDs
  const validatedTasks = generated.tasks.map((task) => ({
    ...task,
    conceptIds: validateAndFilterConceptIds(task.conceptIds),
  }));

  return {
    ...generated,
    tasks: validatedTasks,
  };
}
