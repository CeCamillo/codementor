import { anthropic, MODELS } from '../client';

export interface TestGenerationRequest {
  task: {
    title: string;
    description: string;
    objectives: string[];
    conceptIds: string[];
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedTest {
  testName: string;
  testCode: string;
  testType: 'unit' | 'edge_case' | 'behavior';
  expectedBehavior: string;
}

export interface TestGenerationResult {
  tests: GeneratedTest[];
}

const testGenerationTool = {
  name: 'generate_tests',
  description: 'Generate tests to verify student code submissions',
  input_schema: {
    type: 'object' as const,
    properties: {
      tests: {
        type: 'array',
        description: 'Array of tests to verify the task requirements',
        items: {
          type: 'object',
          properties: {
            testName: {
              type: 'string',
              description: 'Short descriptive name for the test (e.g., "handles empty input")',
            },
            testCode: {
              type: 'string',
              description:
                'JavaScript/TypeScript test code using describe/it/expect syntax. Should test the expected exports/functions.',
            },
            testType: {
              type: 'string',
              enum: ['unit', 'edge_case', 'behavior'],
              description:
                'Type of test: unit (basic functionality), edge_case (boundary conditions), behavior (integration/workflow)',
            },
            expectedBehavior: {
              type: 'string',
              description: 'Human-readable description of what this test verifies',
            },
          },
          required: ['testName', 'testCode', 'testType', 'expectedBehavior'],
        },
      },
    },
    required: ['tests'],
  },
};

function getTestCountByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): {
  unit: number;
  edge: number;
  behavior: number;
} {
  switch (difficulty) {
    case 'beginner':
      return { unit: 2, edge: 1, behavior: 0 };
    case 'intermediate':
      return { unit: 3, edge: 2, behavior: 1 };
    case 'advanced':
      return { unit: 3, edge: 3, behavior: 2 };
  }
}

export async function generateTests(request: TestGenerationRequest): Promise<TestGenerationResult> {
  const testCounts = getTestCountByDifficulty(request.difficulty);

  const systemPrompt = `You are a test generation expert creating tests for a coding education platform.

Your goal is to create tests that:
1. Verify the student's code meets the task requirements
2. Are educational - help students understand what's expected
3. Are appropriate for ${request.difficulty} level students
4. Cover basic functionality, edge cases, and behaviors

Test Requirements:
- Unit tests: ${testCounts.unit} tests for basic functionality
- Edge case tests: ${testCounts.edge} tests for boundary conditions
- Behavior tests: ${testCounts.behavior} tests for integration/workflow

Test Code Format:
- Use describe/it/expect syntax (we provide a simple test runner)
- Available assertions: toBe, toEqual, toBeTruthy, toBeFalsy, toBeNull, toBeUndefined, toBeDefined, toContain, toHaveLength, toThrow, toBeGreaterThan, toBeLessThan
- Tests run in a sandboxed environment with the student's code
- Assume the student exports functions/classes that match the task objectives

For ${request.difficulty} level:
${request.difficulty === 'beginner' ? '- Keep tests simple and focused on basic requirements\n- Avoid complex edge cases\n- Clear, obvious test cases' : ''}
${request.difficulty === 'intermediate' ? '- Include moderate edge cases\n- Test error handling basics\n- Consider common mistakes' : ''}
${request.difficulty === 'advanced' ? '- Comprehensive edge case coverage\n- Test error handling and recovery\n- Performance considerations\n- Integration between components' : ''}`;

  const userMessage = `Generate tests for the following coding task:

## Task: ${request.task.title}

${request.task.description}

### Objectives:
${request.task.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Generate ${testCounts.unit} unit tests, ${testCounts.edge} edge case tests, and ${testCounts.behavior} behavior tests.

Each test should:
- Have a clear, descriptive name
- Test a specific requirement or scenario
- Include the test code using describe/it/expect
- Explain what behavior is being verified`;

  const response = await anthropic.messages.create({
    model: MODELS.SONNET,
    max_tokens: 4096,
    system: systemPrompt,
    tools: [testGenerationTool],
    tool_choice: { type: 'tool', name: 'generate_tests' },
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return valid tests');
  }

  const generated = toolUse.input as TestGenerationResult;

  // Validate and clean up tests
  const validTests = generated.tests.filter((test) => {
    return (
      test.testName &&
      test.testCode &&
      test.testType &&
      test.expectedBehavior &&
      ['unit', 'edge_case', 'behavior'].includes(test.testType)
    );
  });

  return {
    tests: validTests,
  };
}
